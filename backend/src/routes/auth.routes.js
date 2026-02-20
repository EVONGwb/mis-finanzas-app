import { Router } from "express";
import { register, login, registerAdmin } from "../controllers/auth.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();

router.post("/auth/register", register);
router.post("/auth/login", login);

// Admin: crear usuarios con password
router.post("/auth/register-admin", requireAuth, requireRole("admin"), registerAdmin);

// Perfil del usuario logueado
router.get("/auth/me", requireAuth, (req, res) => {
  res.json({ ok: true, data: req.user });
});

export default router;
