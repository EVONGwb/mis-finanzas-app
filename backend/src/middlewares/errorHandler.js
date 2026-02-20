import { HttpError } from "../utils/httpError.js";

export function errorHandler(err, req, res, next) {
  const isHttpError = err instanceof HttpError;
  const status = isHttpError ? err.status : 500;

  const payload = {
    ok: false,
    error: {
      message: isHttpError ? err.message : "Error interno",
      ...(isHttpError && err.details ? { details: err.details } : {})
    }
  };

  // Log útil en consola (sin romper la app)
  if (status >= 500) {
    console.error("❌ ERROR:", err);
  }

  res.status(status).json(payload);
}
