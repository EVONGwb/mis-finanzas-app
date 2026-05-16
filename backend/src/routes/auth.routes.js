import { Router } from "express";
import { register, login, registerAdmin, googleLogin, logout, updateProfile, getSession } from "../controllers/auth.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { wrap } from "../utils/wrap.js";

const router = Router();

router.post("/auth/register", wrap(register));
router.post("/auth/login", wrap(login));
router.post("/auth/google", wrap(googleLogin));
router.post("/auth/logout", wrap(logout));
router.get("/auth/session", wrap(getSession));

// Admin: crear usuarios con password
router.post("/auth/register-admin", requireAuth, requireRole("admin"), wrap(registerAdmin));

router.all(/^\/auth\/webauthn\/.*/, (req, res) => {
  return res.status(410).json({ ok: false, message: "Biometría deshabilitada" });
});

// Perfil del usuario logueado
router.get("/auth/me", requireAuth, wrap((req, res) => res.json({ ok: true, data: req.user })));

router.put("/auth/profile", requireAuth, wrap(updateProfile));

export default router;
