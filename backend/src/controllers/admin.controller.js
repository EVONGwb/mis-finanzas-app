import { User } from "../models/user.model.js";
import { HttpError } from "../utils/httpError.js";
import { writeAuditLog } from "../utils/audit.js";
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

    // Audit Log
    writeAuditLog(req, {
      action: "USER_CREATE",
      entity: "User",
      entityId: newUser._id,
      after: userObj,
      message: `User created: ${email}`
    });

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

    const user = await User.findById(id);
    if (!user) throw new HttpError(404, "Usuario no encontrado");

    const beforeRole = user.role;

    if (user._id.toString() === req.user._id.toString() && role !== "admin") {
       // Opcional: impedir degradarse a uno mismo
    }

    user.role = role;
    await user.save();

    // Audit Log
    writeAuditLog(req, {
      action: "USER_ROLE_CHANGE",
      entity: "User",
      entityId: user._id,
      before: { role: beforeRole },
      after: { role: user.role },
      message: `Role changed from ${beforeRole} to ${role} for ${user.email}`
    });

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

    // Audit Log (NO guardar password)
    writeAuditLog(req, {
      action: "USER_PASSWORD_RESET",
      entity: "User",
      entityId: user._id,
      before: { _id: user._id, email: user.email },
      message: `Password reset for ${user.email}`
    });

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

    // Preparar objeto para log (sin passwordHash)
    const userLog = user.toObject();
    delete userLog.passwordHash;

    // Audit Log
    writeAuditLog(req, {
      action: "USER_DELETE",
      entity: "User",
      entityId: user._id,
      before: userLog,
      message: `User deleted: ${user.email}`
    });

    res.json({ ok: true, message: "Usuario eliminado" });
  } catch (error) {
    next(error);
  }
};

export const promoteSelf = async (req, res) => {
  try {
    const user = await User.findOne({ email: "admin@misfinanzas.com" });

    if (!user) {
      return res.status(404).json({
        ok: false,
        error: { message: "Admin no encontrado" }
      });
    }

    user.role = "admin";
    await user.save();

    return res.json({
      ok: true,
      data: {
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error("[PROMOTE-SELF ERROR]", err);
    return res.status(500).json({
      ok: false,
      error: { message: err.message }
    });
  }
};
