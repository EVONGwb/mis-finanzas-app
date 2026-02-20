import bcrypt from "bcryptjs";
import { User } from "../models/user.model.js";
import { HttpError } from "../utils/httpError.js";
import { signToken } from "../utils/jwt.js";

function isEmailValid(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function register(req, res, next) {
  try {
    const { email, password, name = "" } = req.body;

    if (!email || !password) throw new HttpError(400, "Falta email o password");
    if (!isEmailValid(email)) throw new HttpError(400, "Email inválido");
    if (String(password).length < 6) throw new HttpError(400, "Password mínimo 6 caracteres");

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) throw new HttpError(409, "Ese email ya existe");

    const passwordHash = await bcrypt.hash(String(password), 10);
    const user = await User.create({ email, name, role: "user", passwordHash });

    const token = signToken({ sub: user._id.toString() });
    return res.status(201).json({
      ok: true,
      data: { token, user: { _id: user._id, email: user.email, name: user.name, role: user.role } }
    });
  } catch (err) {
    return next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) throw new HttpError(400, "Falta email o password");

    const user = await User.findOne({ email: String(email).toLowerCase() }).select("+passwordHash");
    if (!user) throw new HttpError(401, "Credenciales incorrectas");

    const ok = await bcrypt.compare(String(password), user.passwordHash);
    if (!ok) throw new HttpError(401, "Credenciales incorrectas");

    const token = signToken({ sub: user._id.toString() });
    return res.json({
      ok: true,
      data: { token, user: { _id: user._id, email: user.email, name: user.name, role: user.role } }
    });
  } catch (err) {
    return next(err);
  }
}
export async function registerAdmin(req, res, next) {
  try {
    const { email, password, name = "", role = "user" } = req.body;

    if (!email || !password) throw new HttpError(400, "Falta email o password");
    if (!isEmailValid(email)) throw new HttpError(400, "Email inválido");
    if (String(password).length < 6) throw new HttpError(400, "Password mínimo 6 caracteres");
    if (role && !["user", "admin"].includes(role)) throw new HttpError(400, "Role inválido");

    const exists = await User.findOne({ email: String(email).toLowerCase() });
    if (exists) throw new HttpError(409, "Ese email ya existe");

    const passwordHash = await bcrypt.hash(String(password), 10);
    const user = await User.create({ email, name, role, passwordHash });

    return res.status(201).json({
      ok: true,
      data: { _id: user._id, email: user.email, name: user.name, role: user.role }
    });
  } catch (err) {
    return next(err);
  }
}
