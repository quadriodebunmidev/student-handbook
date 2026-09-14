import archiver from "archiver";
import Material from "../models/Material.js";
import Course from "../models/Course.js";
import ActivityLog from "../models/ActivityLog.js";
import Report from "../models/Report.js";
import { extractText, inferFileType } from "../utils/fileParser.js";
import { uploadBufferToCloudinary } from "../utils/cloudinaryUpload.js";

// POST /api/materials  (Course Rep, multipart/form-data with "file")
export async function uploadMaterial(req, res, next) {
  try {
    const { courseId, title, description } = req.body;
    if (!courseId || !title || !req.file) {
      return res.status(400).json({ message: "courseId, title and a file are required." });
    }
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found." });

    const fileType = inferFileType(req.file.originalname, req.file.mimetype);
    const [extractedText, cloudinaryResult] = await Promise.all([
      extractText(req.file.buffer, fileType),
      uploadBufferToCloudinary(req.file.buffer, req.file.originalname, fileType),
    ]);

    const material = await Material.create({
      courseId,
      uploadedBy: req.user._id,
      title,
      description,
      fileUrl: cloudinaryResult.secure_url,
      fileName: req.file.originalname,
      fileType,
      size: req.file.size ? `${(req.file.size / (1024 * 1024)).toFixed(1)} MB` : undefined,
      extractedText,
    });

    await ActivityLog.create({ action: `${req.user.name} uploaded "${title}"`, actor: req.user._id });
    res.status(201).json({ material });
  } catch (err) { next(err); }
}

// GET /api/materials/:id
export async function getMaterial(req, res, next) {
  try {
    const material = await Material.findById(req.params.id).populate("uploadedBy", "name");
    if (!material) return res.status(404).json({ message: "Material not found." });
    res.json({ material });
  } catch (err) { next(err); }
}

// PUT /api/materials/:id  (rep who owns it)
export async function updateMaterial(req, res, next) {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) return res.status(404).json({ message: "Material not found." });
    if (String(material.uploadedBy) !== String(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "You can only edit your own materials." });
    }
    const { title, description } = req.body;
    if (title) material.title = title;
    if (description !== undefined) material.description = description;
    await material.save();
    res.json({ material });
  } catch (err) { next(err); }
}

// DELETE /api/materials/:id (rep who owns it, or admin)
export async function deleteMaterial(req, res, next) {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) return res.status(404).json({ message: "Material not found." });
    if (String(material.uploadedBy) !== String(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "You can only delete your own materials." });
    }
    await material.deleteOne();
    await ActivityLog.create({ action: `${req.user.name} deleted "${material.title}"`, actor: req.user._id });
    res.json({ message: "Material deleted." });
  } catch (err) { next(err); }
}

// POST /api/materials/:id/download  (increments counter, returns file URL)
export async function downloadMaterial(req, res, next) {
  try {
    const material = await Material.findByIdAndUpdate(req.params.id, { $inc: { downloads: 1 } }, { new: true });
    if (!material) return res.status(404).json({ message: "Material not found." });
    res.json({ fileUrl: material.fileUrl, fileName: material.fileName });
  } catch (err) { next(err); }
}

// POST /api/materials/:id/bookmark  (toggle for the logged-in student)
export async function toggleBookmark(req, res, next) {
  try {
    const user = req.user;
    const materialId = req.params.id;
    const already = user.bookmarks.some((id) => String(id) === materialId);
    if (already) {
      user.bookmarks = user.bookmarks.filter((id) => String(id) !== materialId);
    } else {
      user.bookmarks.push(materialId);
    }
    await user.save();
    res.json({ bookmarked: !already });
  } catch (err) { next(err); }
}

// GET /api/materials/bookmarks/mine
export async function myBookmarks(req, res, next) {
  try {
    const user = await req.user.populate("bookmarks");
    res.json({ materials: user.bookmarks });
  } catch (err) { next(err); }
}

// GET /api/materials/search?q=
export async function searchMaterials(req, res, next) {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) return res.json({ materials: [] });
    const materials = await Material.find({ $text: { $search: q } }).populate("courseId", "code title department level semester").limit(30);
    res.json({ materials });
  } catch (err) { next(err); }
}

// GET /api/materials/mine  — the logged-in rep's own uploads (dashboard stats).
// Reps previously had no way to list just their own materials and the rep
// dashboard called the admin-only /api/admin/materials endpoint instead,
// which 403s for non-admins — this is the dedicated, correctly-scoped
// replacement for that.
export async function myMaterials(req, res, next) {
  try {
    const materials = await Material.find({ uploadedBy: req.user._id })
      .populate("courseId", "code title department level semester session")
      .sort({ createdAt: -1 });
    res.json({ materials });
  } catch (err) { next(err); }
}

// POST /api/materials/:id/report  (student flags content)
export async function reportMaterial(req, res, next) {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ message: "A reason is required." });
    const report = await Report.create({ materialId: req.params.id, reportedBy: req.user._id, reason });
    res.status(201).json({ report });
  } catch (err) { next(err); }
}

// POST /api/materials/download-all  { ids?: string[] }
// Streams a zip of every requested material's file. If no `ids` are given,
// defaults to everything currently in the logged-in student's dashboard
// feed (their own department/level/semester/session), which is what powers
// the "Download all" button on the student feed page.
export async function downloadAllMaterials(req, res, next) {
  try {
    let { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      const { department, level, semester, session } = req.user;
      const courseFilter = { department, level, semester };
      if (session) courseFilter.session = session;
      const courses = await Course.find(courseFilter).select("_id");
      const materials = await Material.find({ courseId: { $in: courses.map((c) => c._id) } }).select("_id");
      ids = materials.map((m) => String(m._id));
    }

    if (ids.length === 0) {
      return res.status(404).json({ message: "No materials found to download." });
    }

    const materials = await Material.find({ _id: { $in: ids } });
    if (materials.length === 0) {
      return res.status(404).json({ message: "No materials found to download." });
    }

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="lecturevault-materials.zip"`);

    const archive = archiver("zip", { zlib: { level: 6 } });
    archive.on("error", (err) => { throw err; });
    archive.pipe(res);

    const usedNames = new Set();
    const nameFor = (material) => {
      let name = material.fileName || `${material.title}`;
      let candidate = name;
      let i = 1;
      while (usedNames.has(candidate)) {
        const dot = name.lastIndexOf(".");
        candidate = dot > 0 ? `${name.slice(0, dot)} (${i})${name.slice(dot)}` : `${name} (${i})`;
        i++;
      }
      usedNames.add(candidate);
      return candidate;
    };

    for (const material of materials) {
      try {
        const fileRes = await fetch(material.fileUrl);
        if (!fileRes.ok) continue; // skip files that fail to fetch rather than aborting the whole zip
        const buffer = Buffer.from(await fileRes.arrayBuffer());
        archive.append(buffer, { name: nameFor(material) });
      } catch {
        // Skip this file and continue zipping the rest.
      }
    }

    await archive.finalize();

    await Material.updateMany({ _id: { $in: materials.map((m) => m._id) } }, { $inc: { downloads: 1 } });
  } catch (err) { next(err); }
}
