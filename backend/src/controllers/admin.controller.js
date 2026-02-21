import { User } from "../models/user.model.js";
import { HttpError } from "../utils/httpError.js";
import bcrypt from "bcryptjs";

// GET /api/admin/users
export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-passwordHash").sort({ createdAt: -1 });
    res.json({ ok: true, data: users });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/users
export const createUser = async (req, res, next) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password) {
      throw new HttpError(400, "Email y contraseña son obligatorios");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new HttpError(409, "El usuario ya existe");
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      email,
      passwordHash,
      name: name || "",
      role: role || "user"
    });

    const userObj = newUser.toObject();
    delete userObj.passwordHash;

    res.status(201).json({ ok: true, data: userObj });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/users/:id/role
export const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!["admin", "user"].includes(role)) {
      throw new HttpError(400, "Rol inválido");
    }

    // Evitar que un admin se quite permisos a sí mismo si es el único (opcional, pero buena práctica)
    // Aquí simplemente validamos que exista
    const user = await User.findById(id);
    if (!user) throw new HttpError(404, "Usuario no encontrado");

    if (user._id.toString() === req.user._id.toString() && role !== "admin") {
       // Opcional: impedir degradarse a uno mismo para evitar bloqueo accidental
       // throw new HttpError(403, "No puedes quitarte el rol de admin a ti mismo");
    }

    user.role = role;
    await user.save();

    res.json({ ok: true, data: { _id: user._id, role: user.role } });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/users/:id/password
export const resetUserPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      throw new HttpError(400, "La contraseña debe tener al menos 6 caracteres");
    }

    const user = await User.findById(id);
    if (!user) throw new HttpError(404, "Usuario no encontrado");

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(password, salt);
    await user.save();

    res.json({ ok: true, message: "Contraseña actualizada correctamente" });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/users/:id
export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === req.user._id.toString()) {
      throw new HttpError(403, "No puedes eliminar tu propia cuenta desde aquí");
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) throw new HttpError(404, "Usuario no encontrado");

    res.json({ ok: true, message: "Usuario eliminado" });
  } catch (error) {
    next(error);
  }
};
