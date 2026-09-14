import express from "express";
import { getDashboard, getExploreFeed, getStudyTip } from "../controllers/feedController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/dashboard", authMiddleware, getDashboard);
router.get("/explore", authMiddleware, getExploreFeed);
router.get("/study-tip", authMiddleware, getStudyTip);

export default router;
