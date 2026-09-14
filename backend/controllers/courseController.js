import Course from "../models/Course.js";
import Material from "../models/Material.js";
import ActivityLog from "../models/ActivityLog.js";
import { isValidSession } from "../utils/sessions.js";

// GET /api/courses?department=&level=&semester=&session=
export async function listCourses(req, res, next) {
  try {
    const { department, level, semester, session } = req.query;
    const filter = {};
    if (department && department !== "All") filter.department = department;
    if (level && level !== "All") filter.level = Number(level);
    if (semester && semester !== "All") filter.semester = semester;
    if (session && session !== "All") filter.session = session;
    const courses = await Course.find(filter).sort({ session: -1, code: 1 });
    res.json({ courses });
  } catch (err) { next(err); }
}

// GET /api/courses/:id
export async function getCourse(req, res, next) {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found." });
    const materials = await Material.find({ courseId: course._id }).populate("uploadedBy", "name").sort({ createdAt: -1 });
    res.json({ course, materials });
  } catch (err) { next(err); }
}

// POST /api/courses (admin)
export async function createCourse(req, res, next) {
  try {
    const { code, title, department, level, semester, session, description } = req.body;
    if (!code || !title || !department || !level || !semester || !session) {
      return res.status(400).json({ message: "code, title, department, level, semester and session are required." });
    }
    if (!isValidSession(session)) return res.status(400).json({ message: "Enter a valid academic session, e.g. 2025/2026." });

    const exists = await Course.findOne({ code: code.toUpperCase().trim(), session });
    if (exists) return res.status(409).json({ message: `${code.toUpperCase()} already exists for the ${session} session.` });

    const course = await Course.create({ code, title, department, level, semester, session, description });
    await ActivityLog.create({ action: `${req.user.name} added course ${code} (${session})`, actor: req.user._id });
    res.status(201).json({ course });
  } catch (err) { next(err); }
}

// PUT /api/courses/:id (admin)
export async function updateCourse(req, res, next) {
  try {
    if (req.body.session && !isValidSession(req.body.session)) {
      return res.status(400).json({ message: "Enter a valid academic session, e.g. 2025/2026." });
    }
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!course) return res.status(404).json({ message: "Course not found." });
    await ActivityLog.create({ action: `${req.user.name} updated course ${course.code}`, actor: req.user._id });
    res.json({ course });
  } catch (err) { next(err); }
}

// DELETE /api/courses/:id (admin)
export async function deleteCourse(req, res, next) {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found." });
    await ActivityLog.create({ action: `${req.user.name} removed course ${course.code}`, actor: req.user._id });
    res.json({ message: "Course removed." });
  } catch (err) { next(err); }
}
