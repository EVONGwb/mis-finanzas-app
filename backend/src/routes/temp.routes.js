import { Router } from "express";
import { User } from "../models/user.model.js";

const router = Router();

// Endpoint temporal para actualizar rol de admin
router.get("/promote", async (req, res) => {
  const { secret } = req.query;

  // Clave secreta temporal para evitar uso accidental
  if (secret !== "evongo-admin-fix") {
    return res.status(403).json({ ok: false, error: "Clave secreta inválida" });
  }

  const targetEmail = "admin@misfinanzas.com";

  try {
    const user = await User.findOne({ email: targetEmail });
    if (!user) {
      return res.status(404).json({ ok: false, error: `Usuario ${targetEmail} no encontrado` });
    }

    if (user.role === "admin") {
      return res.json({ ok: true, message: "El usuario ya es admin" });
    }

    user.role = "admin";
    await user.save();

    res.json({ ok: true, message: `Usuario ${targetEmail} actualizado a rol admin exitosamente` });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

export default router;
