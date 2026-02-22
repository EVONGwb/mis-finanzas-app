import { Router } from "express";
import { register, login, registerAdmin, googleLogin } from "../controllers/auth.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();

router.post("/auth/register", register);
router.post("/auth/login", login);
router.post("/auth/google", googleLogin);

// Admin: crear usuarios con password
router.post("/auth/register-admin", requireAuth, requireRole("admin"), registerAdmin);

// Perfil del usuario logueado
router.get("/auth/me", requireAuth, (req, res) => {
  res.json({ ok: true, data: req.user });
});

export default router;
