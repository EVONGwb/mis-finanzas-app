import { HttpError } from "../utils/httpError.js";
import { verifyToken } from "../utils/jwt.js";
import { User } from "../models/user.model.js";

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [type, token] = header.split(" ");

    if (type !== "Bearer" || !token) {
      throw new HttpError(401, "No autenticado (falta Bearer token)");
    }

    const decoded = verifyToken(token); // { sub: userId, ... }
    const user = await User.findById(decoded.sub).select("-passwordHash");
    if (!user) throw new HttpError(401, "Usuario no válido");

    req.user = user;
    next();
  } catch (err) {
    return next(err);
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return next(new HttpError(401, "No autenticado"));
    if (req.user.role !== role) return next(new HttpError(403, "No autorizado"));
    next();
  };
}
