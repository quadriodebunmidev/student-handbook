import mongoose from "mongoose";

const materialSchema = new mongoose.Schema(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    fileType: { type: String, enum: ["pdf", "pptx", "docx", "xlsx", "image"], required: true },
    size: { type: String },
    extractedText: { type: String, default: "" }, // used by the AI question generator
    downloads: { type: Number, default: 0 },
    quizzesGenerated: { type: Number, default: 0 },
  },
  { timestamps: true }
);

materialSchema.index({ title: "text", description: "text" });

export default mongoose.model("Material", materialSchema);
