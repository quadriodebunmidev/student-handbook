import express from "express";
import { signup, repSignup, login, googleLogin, me, updateProfile, logout, forgotPassword, resetPassword } from "../controllers/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/rep-signup", repSignup);
router.post("/login", login);
router.post("/google", googleLogin);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/me", authMiddleware, me);
router.put("/me", authMiddleware, updateProfile);

export default router;
