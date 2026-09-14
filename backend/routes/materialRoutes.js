import express from "express";
import {
  uploadMaterial, getMaterial, updateMaterial, deleteMaterial,
  downloadMaterial, downloadAllMaterials, toggleBookmark, myBookmarks, myMaterials, searchMaterials, reportMaterial,
} from "../controllers/materialController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { repApprovedMiddleware } from "../middleware/repApprovedMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.get("/search", authMiddleware, searchMaterials);
router.get("/bookmarks/mine", authMiddleware, myBookmarks);
router.get("/mine", authMiddleware, repApprovedMiddleware, myMaterials);
router.post("/download-all", authMiddleware, downloadAllMaterials);
router.post("/", authMiddleware, repApprovedMiddleware, upload.single("file"), uploadMaterial);
router.get("/:id", authMiddleware, getMaterial);
router.put("/:id", authMiddleware, repApprovedMiddleware, updateMaterial);
router.delete("/:id", authMiddleware, repApprovedMiddleware, deleteMaterial);
router.post("/:id/download", authMiddleware, downloadMaterial);
router.post("/:id/bookmark", authMiddleware, toggleBookmark);
router.post("/:id/report", authMiddleware, reportMaterial);

export default router;
