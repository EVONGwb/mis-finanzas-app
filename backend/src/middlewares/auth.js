import { HttpError } from "../utils/httpError.js";
import { verifyToken } from "../utils/jwt.js";
import { User } from "../models/user.model.js";

function parseCookies(header) {
  const raw = String(header || "");
  if (!raw) return {};
  return raw.split(";").reduce((acc, part) => {
    const idx = part.indexOf("=");
    if (idx === -1) return acc;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (!key) return acc;
    acc[key] = decodeURIComponent(value);
    return acc;
  }, {});
}

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [type, token] = header.split(" ");

    let authToken = type === "Bearer" && token ? token : "";
    if (!authToken) {
      const cookies = parseCookies(req.headers.cookie);
      authToken = cookies.mf_session || "";
    }
    if (!authToken) throw new HttpError(401, "No autenticado");

    let decoded;
    try {
      decoded = verifyToken(authToken); // { sub: userId, ... }
    } catch (e) {
      throw new HttpError(401, "Token inválido o expirado");
    }
    const user = await User.findById(decoded.sub).select("-passwordHash -webauthnCredentials -webauthnCurrentChallenge");
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
