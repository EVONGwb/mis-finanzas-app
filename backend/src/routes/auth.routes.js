import { Router } from "express";
import { register, login, registerAdmin, googleLogin, updateProfile } from "../controllers/auth.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { getAuthenticationOptions, getRegistrationOptions, verifyAuthentication, verifyRegistration } from "../controllers/webauthn.controller.js";

const router = Router();

router.post("/auth/register", register);
router.post("/auth/login", login);
router.post("/auth/google", googleLogin);

// Admin: crear usuarios con password
router.post("/auth/register-admin", requireAuth, requireRole("admin"), registerAdmin);

router.get("/auth/webauthn/register/options", requireAuth, getRegistrationOptions);
router.post("/auth/webauthn/register/verify", requireAuth, verifyRegistration);
router.get("/auth/webauthn/login/options", requireAuth, getAuthenticationOptions);
router.post("/auth/webauthn/login/verify", requireAuth, verifyAuthentication);

// Perfil del usuario logueado
router.get("/auth/me", requireAuth, (req, res) => {
  res.json({ ok: true, data: req.user });
});

router.put("/auth/profile", requireAuth, updateProfile);

export default router;
