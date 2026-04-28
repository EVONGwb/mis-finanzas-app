import { DeudaTracking } from "../models/deudaTracking.model.js";
import { HttpError } from "../utils/httpError.js";

function normalizeCodigo(value) {
  return String(value || "").trim().toUpperCase();
}

function isCodigoValid(codigo) {
  if (!codigo) return false;
  if (codigo.length < 6 || codigo.length > 64) return false;
  return /^[A-Z0-9]+$/.test(codigo);
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
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

