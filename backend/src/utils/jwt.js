import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function signToken(payload) {
  if (!env.JWT_SECRET) throw new Error("JWT_SECRET no configurado");
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

export function verifyToken(token) {
  if (!env.JWT_SECRET) throw new Error("JWT_SECRET no configurado");
  return jwt.verify(token, env.JWT_SECRET);
}
