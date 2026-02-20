import { HttpError } from "../utils/httpError.js";

export function notFound(req, res, next) {
  next(new HttpError(404, "Ruta no encontrada", { path: req.originalUrl }));
}
