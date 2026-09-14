import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, uppercase: true, trim: true }, // e.g. CSC101
    title: { type: String, required: true },
    department: { type: String, required: true },
    level: { type: Number, required: true, enum: [100, 200, 300, 400] },
    semester: { type: String, required: true, enum: ["First Semester", "Second Semester"] },
    session: { type: String, required: true, trim: true }, // academic session/year, e.g. "2025/2026"
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

// A course code is unique per academic session (the same code can be
// re-offered every session), rather than globally unique.
courseSchema.index({ code: 1, session: 1 }, { unique: true });

export default mongoose.model("Course", courseSchema);
