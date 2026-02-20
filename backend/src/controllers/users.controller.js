import { User } from "../models/user.model.js";
import { HttpError } from "../utils/httpError.js";

function isEmailValid(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isRoleValid(role) {
  return ["user", "admin"].includes(role);
}

export async function createUser(req, res, next) {
  try {
    const { email, name = "", role = "user" } = req.body;

    if (!email) throw new HttpError(400, "Falta email");
    if (!isEmailValid(email)) throw new HttpError(400, "Email inválido");
    if (role && !isRoleValid(role)) throw new HttpError(400, "Role inválido", { allowed: ["user", "admin"] });

    const created = await User.create({ email, name, role });
    return res.status(201).json({ ok: true, data: created });
  } catch (err) {
    if (err?.code === 11000) return next(new HttpError(409, "Ese email ya existe"));
    return next(err);
  }
}

export async function listUsers(req, res, next) {
  try {
    const users = await User.find().sort({ createdAt: -1 }).limit(200);
    return res.json({ ok: true, data: users });
  } catch (err) {
    return next(err);
  }
}

export async function getUserById(req, res, next) {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) throw new HttpError(404, "Usuario no encontrado");
    return res.json({ ok: true, data: user });
  } catch (err) {
    // CastError => id inválido
    if (err?.name === "CastError") return next(new HttpError(400, "ID inválido"));
    return next(err);
  }
}

export async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const { name, role } = req.body;

    if (role !== undefined && !isRoleValid(role)) {
      throw new HttpError(400, "Role inválido", { allowed: ["user", "admin"] });
    }

    const updated = await User.findByIdAndUpdate(
      id,
      { ...(name !== undefined ? { name } : {}), ...(role !== undefined ? { role } : {}) },
      { new: true, runValidators: true }
    );

    if (!updated) throw new HttpError(404, "Usuario no encontrado");
    return res.json({ ok: true, data: updated });
  } catch (err) {
    if (err?.name === "CastError") return next(new HttpError(400, "ID inválido"));
    return next(err);
  }
}

export async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;
    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) throw new HttpError(404, "Usuario no encontrado");
    return res.json({ ok: true, data: deleted });
  } catch (err) {
    if (err?.name === "CastError") return next(new HttpError(400, "ID inválido"));
    return next(err);
  }
}
