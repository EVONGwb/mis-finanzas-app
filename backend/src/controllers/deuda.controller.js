import { randomInt } from "crypto";
import mongoose from "mongoose";
import { DeudaTracking } from "../models/deudaTracking.model.js";
import { HttpError } from "../utils/httpError.js";

function normalizeCodigo(value) {
  return String(value || "").trim().toUpperCase();
}

function isCodigoValid(codigo) {
  if (!codigo) return false;
  if (/^MF-[A-Z0-9]{6,10}$/.test(codigo)) return true;
  return /^[A-Z0-9]{6,64}$/.test(codigo);
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function parseDateOrNull(value) {
  if (value === undefined || value === null || value === "") return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function generateCodigoMf(length) {
  const size = Number(length);
  const n = Number.isFinite(size) ? Math.trunc(size) : 6;
  if (n < 6 || n > 10) throw new HttpError(400, "Longitud de código inválida");

  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "MF-";
  for (let i = 0; i < n; i++) out += chars[randomInt(0, chars.length)];
  return out;
}

export async function consultarDeuda(req, res, next) {
  try {
    const codigo = normalizeCodigo(req.body?.codigo);
    if (!isCodigoValid(codigo)) {
      throw new HttpError(400, "Código inválido");
    }

    const deuda = await DeudaTracking.findOne({ clienteCodigo: codigo });
    if (!deuda) throw new HttpError(404, "Código no encontrado");

    const total = Math.max(0, toNumber(deuda.total));
    const pagado = Math.max(0, Math.min(total, toNumber(deuda.pagado)));
    const pendiente = Math.max(0, total - pagado);
    const porcentajePagado = total > 0 ? Math.round((pagado / total) * 100) : 100;

    return res.json({
      ok: true,
      data: {
        codigo: deuda.clienteCodigo,
        total,
        pagado,
        pendiente,
        porcentajePagado,
        fechaInicio: deuda.fechaInicio,
        fechaFin: deuda.fechaFin,
        estado: deuda.estado
      }
    });
  } catch (err) {
    return next(err);
  }
}

export async function crearDeuda(req, res, next) {
  try {
    const total = toNumber(req.body?.total);
    const pagadoRaw = req.body?.pagado;
    const pagado = pagadoRaw === undefined ? 0 : toNumber(pagadoRaw);
    const fechaInicio = parseDateOrNull(req.body?.fechaInicio) ?? new Date();
    const fechaFin = parseDateOrNull(req.body?.fechaFin);
    const estadoRaw = req.body?.estado;
    const userIdRaw = req.body?.userId;
    const codigoLengthRaw = req.body?.codigoLength;

    if (!(total > 0)) throw new HttpError(400, "Total inválido");
    if (pagado < 0) throw new HttpError(400, "Pagado inválido");

    const pagadoClamped = Math.min(pagado, total);
    let estado = typeof estadoRaw === "string" ? String(estadoRaw).trim().toLowerCase() : "";
    if (estado && !["activo", "pagado"].includes(estado)) throw new HttpError(400, "Estado inválido");

    if (!estado) estado = pagadoClamped >= total ? "pagado" : "activo";

    let userId = null;
    if (userIdRaw !== undefined && userIdRaw !== null && String(userIdRaw).trim() !== "") {
      const asString = String(userIdRaw).trim();
      if (!mongoose.Types.ObjectId.isValid(asString)) throw new HttpError(400, "userId inválido");
      userId = asString;
    }

    const maxAttempts = 10;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const clienteCodigo = generateCodigoMf(codigoLengthRaw ?? 6);
      try {
        const deuda = await DeudaTracking.create({
          userId,
          clienteCodigo,
          total,
          pagado: pagadoClamped,
          fechaInicio,
          fechaFin,
          estado
        });

        return res.status(201).json({
          ok: true,
          data: {
            codigo: deuda.clienteCodigo,
            total: deuda.total,
            pagado: deuda.pagado,
            fechaInicio: deuda.fechaInicio,
            fechaFin: deuda.fechaFin,
            estado: deuda.estado
          }
        });
      } catch (err) {
        if (err?.code === 11000) continue;
        throw err;
      }
    }

    throw new HttpError(500, "No se pudo generar un código único");
  } catch (err) {
    return next(err);
  }
}
