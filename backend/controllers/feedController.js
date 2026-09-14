import Course from "../models/Course.js";
import Material from "../models/Material.js";
import { generateStudyTip } from "../utils/aiService.js";

// GET /api/feed/dashboard?sort=recent|downloads|session
// Auto-scoped to the student's own registered department, level, semester
// and academic session — this is "their feed". Previously this only ever
// matched on department/level/semester, so students never actually saw
// materials scoped to the session they registered under, and courses from a
// different session with the same department/level would bleed into their
// feed. It also ignored the case where the logged-in user is missing one of
// these fields (e.g. legacy accounts created before `session` existed).
export async function getDashboard(req, res, next) {
  try {
    const { department, level, semester, session } = req.user;
    const { sort = "recent" } = req.query;

    const filter = { department, level, semester };
    // Only constrain by session if the student actually has one on file. And
    // when we do, still include courses that predate the `session` field
    // (created before this feature existed, so they have no session value
    // saved) — otherwise every course/material created before this update
    // would silently vanish from every student's feed.
    if (session) {
      filter.$or = [
        { session },
        { session: { $exists: false } },
        { session: null },
        { session: "" },
      ];
    }

    const courses = await Course.find(filter).sort({ code: 1 });
    const courseIds = courses.map((c) => c._id);

    const materialSort = sort === "downloads" ? { downloads: -1 } : { createdAt: -1 };
    const materials = await Material.find({ courseId: { $in: courseIds } })
      .populate("uploadedBy", "name")
      .populate("courseId", "code title department level semester session")
      .sort(materialSort)
      .limit(100);

    res.json({ courses, materials, scope: { department, level, semester, session: session || null } });
  } catch (err) { next(err); }
}

// GET /api/feed/study-tip  — a fresh AI-generated study tip, shown on login
export async function getStudyTip(req, res, next) {
  try {
    const tip = await generateStudyTip();
    res.json({ tip });
  } catch (err) { next(err); }
}

// GET /api/feed/explore?department=&level=&semester=&session=  — browse other departments (read-only)
export async function getExploreFeed(req, res, next) {
  try {
    const { department, level, semester, session } = req.query;
    const filter = {};
    if (department && department !== "All") filter.department = department;
    if (level && level !== "All") filter.level = Number(level);
    if (semester && semester !== "All") filter.semester = semester;
    if (session && session !== "All") filter.session = session;
    const courses = await Course.find(filter).sort({ code: 1 });
    res.json({ courses });
  } catch (err) { next(err); }
}
