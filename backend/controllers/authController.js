import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import ActivityLog from "../models/ActivityLog.js";
import { ENV } from "../config/env.js";
import { isValidEmail, isValidMatric, isValidPassword } from "../utils/validators.js";
import { isValidSession } from "../utils/sessions.js";

const googleClient = new OAuth2Client(ENV.googleClientId);

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, ENV.jwtSecret, { expiresIn: ENV.jwtExpiresIn });
}

function publicUser(user) {
  const obj = user.toObject ? user.toObject() : user;
  delete obj.password;
  return obj;
}

function sendAuthResponse(res, user, status = 200) {
  const token = signToken(user);
  res.cookie("token", token, {
    httpOnly: true,
    secure: ENV.nodeEnv === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.status(status).json({ token, user: publicUser(user) });
}

// POST /api/auth/signup  (student self-registration)
export async function signup(req, res, next) {
  try {
    const { matricNumber, name, department, level, semester, session, email, password } = req.body;
    if (!matricNumber || !name || !department || !level || !semester || !session || !email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }
    if (!isValidEmail(email)) return res.status(400).json({ message: "Enter a valid email." });
    if (!isValidMatric(matricNumber)) return res.status(400).json({ message: "Enter a valid matric number." });
    if (!isValidPassword(password)) return res.status(400).json({ message: "Password must be at least 6 characters." });
    if (!isValidSession(session)) return res.status(400).json({ message: "Enter a valid academic session, e.g. 2025/2026." });

    const exists = await User.findOne({ $or: [{ email }, { matricNumber }] });
    if (exists) return res.status(409).json({ message: "An account with that email or matric number already exists." });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      matricNumber, name, department, level, semester, session, email, password: hashed, role: "student",
    });

    sendAuthResponse(res, user, 201);
  } catch (err) { next(err); }
}

// POST /api/auth/rep-signup  (course rep application -> pending)
export async function repSignup(req, res, next) {
  try {
    const { matricNumber, name, department, repCourses, email, password, repNote, session, repType } = req.body;
    if (!matricNumber || !name || !department || !email || !password) {
      return res.status(400).json({ message: "All required fields must be filled." });
    }
    const resolvedRepType = repType === "class" ? "class" : "course";
    const exists = await User.findOne({ $or: [{ email }, { matricNumber }] });
    if (exists) return res.status(409).json({ message: "An account with that email or matric number already exists." });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      matricNumber, name, department, repCourses, email, password: hashed, session,
      role: "rep", repStatus: "pending", repNote, repType: resolvedRepType,
    });

    const label = resolvedRepType === "class" ? "Class Rep" : "Course Rep";
    await ActivityLog.create({ action: `${name} applied to become a ${label}`, actor: user._id });

    res.status(201).json({ message: "Application submitted. You'll be notified once an admin reviews it.", user: publicUser(user) });
  } catch (err) { next(err); }
}

// POST /api/auth/login
export async function login(req, res, next) {
  try {
    const { identifier, password } = req.body; // identifier = matric number OR email
    if (!identifier || !password) return res.status(400).json({ message: "Enter your matric number/email and password." });

    const user = await User.findOne({ $or: [{ email: identifier.toLowerCase() }, { matricNumber: identifier }] });
    if (!user || !user.password) return res.status(401).json({ message: "No account found with those credentials." });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Incorrect password." });

    if (user.suspended) return res.status(403).json({ message: "Your account has been suspended. Contact an admin." });

    if (user.role === "rep" && user.repStatus === "pending") {
      return res.status(403).json({ code: "REP_PENDING", message: "Your Rep application is still under review." });
    }
    if (user.role === "rep" && user.repStatus === "rejected") {
      return res.status(403).json({ code: "REP_REJECTED", message: `Application rejected: ${user.rejectionReason || "no reason given"}.` });
    }

    sendAuthResponse(res, user);
  } catch (err) { next(err); }
}

// POST /api/auth/google  { idToken, matricNumber?, department?, level?, semester? }
export async function googleLogin(req, res, next) {
  try {
    const { idToken, matricNumber, department, level, semester, session } = req.body;
    if (!idToken) return res.status(400).json({ message: "Missing Google ID token." });

    const ticket = await googleClient.verifyIdToken({ idToken, audience: ENV.googleClientId });
    const payload = ticket.getPayload();

    // Returning user (found by Google ID, or by email if they'd previously
    // signed up the normal way) — log them straight in. This is the path
    // that must run for every sign-in after the first one, so the
    // "finish your profile" screen never shows again for them.
    let user = await User.findOne({ googleId: payload.sub });
    if (!user) user = await User.findOne({ email: payload.email });

    if (user) {
      if (!user.googleId) { user.googleId = payload.sub; await user.save(); }
      if (user.suspended) return res.status(403).json({ message: "Your account has been suspended. Contact an admin." });
      return sendAuthResponse(res, user);
    }

    // First-time Google sign-in for this email — we don't have a student
    // profile yet. Tell the frontend to collect matric number / department /
    // level / session ONCE; it should never redirect here again afterwards
    // since the branch above will now match on subsequent logins.
    if (!matricNumber || !department || !level || !session) {
      return res.status(200).json({ code: "NEEDS_PROFILE", email: payload.email, name: payload.name });
    }

    if (!isValidSession(session)) return res.status(400).json({ message: "Enter a valid academic session, e.g. 2025/2026." });

    const clash = await User.findOne({ matricNumber });
    if (clash) return res.status(409).json({ message: "An account with that matric number already exists." });

    user = await User.create({
      name: payload.name,
      email: payload.email,
      googleId: payload.sub,
      matricNumber, department, level, session, semester: semester || "First Semester",
      role: "student",
    });

    sendAuthResponse(res, user, 201);
  } catch (err) { next(err); }
}

// GET /api/auth/me
export async function me(req, res) {
  res.json({ user: publicUser(req.user) });
}

// PUT /api/auth/me  — logged-in user edits their own profile details.
// Matric number, email and role are intentionally not editable here to
// avoid identity/permission mixups; use the admin tools for those.
export async function updateProfile(req, res, next) {
  try {
    const { name, department, level, semester, session, currentPassword, newPassword } = req.body;
    const user = req.user;

    if (session !== undefined && session !== "" && !isValidSession(session)) {
      return res.status(400).json({ message: "Enter a valid academic session, e.g. 2025/2026." });
    }
    if (level !== undefined && level !== "" && ![100, 200, 300, 400].includes(Number(level))) {
      return res.status(400).json({ message: "Enter a valid level." });
    }

    if (name) user.name = name;
    if (department) user.department = department;
    if (level) user.level = Number(level);
    if (semester) user.semester = semester;
    if (session) user.session = session;

    if (newPassword) {
      if (!isValidPassword(newPassword)) {
        return res.status(400).json({ message: "New password must be at least 6 characters." });
      }
      if (user.password) {
        if (!currentPassword) return res.status(400).json({ message: "Enter your current password to set a new one." });
        const match = await bcrypt.compare(currentPassword, user.password);
        if (!match) return res.status(401).json({ message: "Current password is incorrect." });
      }
      user.password = await bcrypt.hash(newPassword, 10);
    }

    await user.save();
    res.json({ user: publicUser(user) });
  } catch (err) { next(err); }
}

// POST /api/auth/logout
export async function logout(req, res) {
  res.clearCookie("token");
  res.json({ message: "Logged out." });
}

// POST /api/auth/forgot-password  (stub — wire up nodemailer with real SMTP creds)
export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    // Always respond the same way whether or not the account exists, to avoid leaking which emails are registered.
    if (user) {
      const resetToken = jwt.sign({ id: user._id }, ENV.jwtSecret, { expiresIn: "1h" });
      user.passwordResetToken = resetToken;
      user.passwordResetExpires = Date.now() + 60 * 60 * 1000;
      await user.save();
      // TODO: send resetToken via nodemailer using ENV.email credentials
      console.log(`Password reset link for ${email}: ${ENV.clientUrl}/reset-password?token=${resetToken}`);
    }
    res.json({ message: "If that email is registered, a reset link has been sent." });
  } catch (err) { next(err); }
}

// POST /api/auth/reset-password  { token, password }
export async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;
    const decoded = jwt.verify(token, ENV.jwtSecret);
    const user = await User.findOne({ _id: decoded.id, passwordResetToken: token, passwordResetExpires: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ message: "Reset link is invalid or has expired." });

    user.password = await bcrypt.hash(password, 10);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    res.json({ message: "Password updated. You can now log in." });
  } catch (err) {
    res.status(400).json({ message: "Reset link is invalid or has expired." });
  }
}
