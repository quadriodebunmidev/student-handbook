import express from "express";
import { generateQuiz, generateTheoryQuiz, getQuiz, submitQuiz, myAttempts, myAnalytics } from "../controllers/quizController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/generate", authMiddleware, generateQuiz);
router.post("/generate-theory", authMiddleware, generateTheoryQuiz);
router.get("/attempts/mine", authMiddleware, myAttempts);
router.get("/analytics/mine", authMiddleware, myAnalytics);
router.get("/:id", authMiddleware, getQuiz);
router.post("/:id/submit", authMiddleware, submitQuiz);

export default router;
