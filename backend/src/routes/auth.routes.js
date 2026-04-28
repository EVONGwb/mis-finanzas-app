import { Router } from "express";
import { register, login, registerAdmin, googleLogin, logout, updateProfile, getSession } from "../controllers/auth.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();

router.post("/auth/register", register);
router.post("/auth/login", login);
router.post("/auth/google", googleLogin);
router.post("/auth/logout", logout);
router.get("/auth/session", getSession);

// Admin: crear usuarios con password
router.post("/auth/register-admin", requireAuth, requireRole("admin"), registerAdmin);

router.all(/^\/auth\/webauthn\/.*/, (req, res) => {
  return res.status(410).json({ ok: false, message: "Biometría deshabilitada" });
});

// Perfil del usuario logueado
router.get("/auth/me", requireAuth, (req, res) => {
  res.json({ ok: true, data: req.user });
});

router.put("/auth/profile", requireAuth, updateProfile);

export default router;
