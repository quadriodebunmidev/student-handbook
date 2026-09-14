import User from "../models/User.js";
import Material from "../models/Material.js";
import Course from "../models/Course.js";
import Report from "../models/Report.js";
import ActivityLog from "../models/ActivityLog.js";

// GET /api/admin/reps/pending
export async function listPendingReps(req, res, next) {
  try {
    const reps = await User.find({ role: "rep", repStatus: "pending" }).select("-password");
    res.json({ reps });
  } catch (err) { next(err); }
}

// POST /api/admin/reps/:id/approve
export async function approveRep(req, res, next) {
  try {
    const rep = await User.findByIdAndUpdate(req.params.id, { repStatus: "active" }, { new: true });
    if (!rep) return res.status(404).json({ message: "Applicant not found." });
    await ActivityLog.create({ action: `Admin approved Course Rep application from ${rep.name}`, actor: req.user._id });
    // TODO: send approval email via nodemailer
    res.json({ message: `${rep.name} approved as Course Rep.`, rep });
  } catch (err) { next(err); }
}

// POST /api/admin/reps/:id/reject  { reason }
export async function rejectRep(req, res, next) {
  try {
    const { reason } = req.body;
    const rep = await User.findByIdAndUpdate(req.params.id, { repStatus: "rejected", rejectionReason: reason || "Not specified" }, { new: true });
    if (!rep) return res.status(404).json({ message: "Applicant not found." });
    await ActivityLog.create({ action: `Admin rejected Course Rep application from ${rep.name}`, actor: req.user._id });
    // TODO: send rejection email via nodemailer
    res.json({ message: `${rep.name}'s application rejected.`, rep });
  } catch (err) { next(err); }
}

// GET /api/admin/users?search=
export async function listUsers(req, res, next) {
  try {
    const { search } = req.query;
    const filter = search
      ? { $or: [{ name: new RegExp(search, "i") }, { email: new RegExp(search, "i") }, { matricNumber: new RegExp(search, "i") }] }
      : {};
    const users = await User.find(filter).select("-password").sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) { next(err); }
}

// POST /api/admin/users/:id/suspend  (toggles suspension)
export async function toggleSuspendUser(req, res, next) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });
    if (user.role === "admin") return res.status(400).json({ message: "Admins can't be suspended." });
    user.suspended = !user.suspended;
    await user.save();
    await ActivityLog.create({ action: `Admin ${user.suspended ? "suspended" : "reactivated"} ${user.name}`, actor: req.user._id });
    res.json({ user });
  } catch (err) { next(err); }
}

// GET /api/admin/materials
export async function listAllMaterials(req, res, next) {
  try {
    const materials = await Material.find().populate("uploadedBy", "name").populate("courseId", "code title").sort({ createdAt: -1 });
    res.json({ materials });
  } catch (err) { next(err); }
}

// DELETE /api/admin/materials/:id
export async function removeMaterial(req, res, next) {
  try {
    const material = await Material.findByIdAndDelete(req.params.id);
    if (!material) return res.status(404).json({ message: "Material not found." });
    await ActivityLog.create({ action: `Admin removed material "${material.title}"`, actor: req.user._id });
    res.json({ message: "Material removed." });
  } catch (err) { next(err); }
}

// GET /api/admin/reports
export async function listReports(req, res, next) {
  try {
    const reports = await Report.find().populate("materialId", "title").populate("reportedBy", "name").sort({ createdAt: -1 });
    res.json({ reports });
  } catch (err) { next(err); }
}

// POST /api/admin/reports/:id/resolve
export async function resolveReport(req, res, next) {
  try {
    const report = await Report.findByIdAndUpdate(req.params.id, { status: "resolved" }, { new: true });
    if (!report) return res.status(404).json({ message: "Report not found." });
    await ActivityLog.create({ action: "Admin resolved a content report", actor: req.user._id });
    res.json({ report });
  } catch (err) { next(err); }
}

// GET /api/admin/activity-log
export async function getActivityLog(req, res, next) {
  try {
    const log = await ActivityLog.find().populate("actor", "name").sort({ createdAt: -1 }).limit(100);
    res.json({ log });
  } catch (err) { next(err); }
}

// GET /api/admin/analytics
export async function getPlatformAnalytics(req, res, next) {
  try {
    const [totalStudents, activeReps, pendingReps, totalMaterials, courses, materials] = await Promise.all([
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "rep", repStatus: "active" }),
      User.countDocuments({ role: "rep", repStatus: "pending" }),
      Material.countDocuments(),
      Course.find(),
      Material.find().populate("courseId", "department"),
    ]);

    const downloadsByDept = {};
    materials.forEach((m) => {
      const dept = m.courseId?.department || "Unknown";
      downloadsByDept[dept] = (downloadsByDept[dept] || 0) + m.downloads;
    });

    const mostDownloaded = [...materials].sort((a, b) => b.downloads - a.downloads).slice(0, 5)
      .map((m) => ({ title: m.title, downloads: m.downloads }));

    res.json({ totalStudents, activeReps, pendingReps, totalMaterials, totalCourses: courses.length, downloadsByDept, mostDownloaded });
  } catch (err) { next(err); }
}
