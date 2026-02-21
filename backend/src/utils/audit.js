import { AuditLog } from "../models/auditLog.model.js";
import { logger } from "../config/logger.js";

/**
 * Registra un evento de auditoría en la base de datos.
 * Esta función es "fire and forget" (no bloquea) y maneja sus propios errores.
 * 
 * @param {Object} req - Objeto request de Express
 * @param {Object} payload - Datos del evento
 * @param {string} payload.action - Tipo de acción (USER_CREATE, etc.)
 * @param {string} payload.entity - Entidad afectada (User, Income, etc.)
 * @param {string} [payload.entityId] - ID de la entidad
 * @param {string} [payload.message] - Descripción opcional
 * @param {Object} [payload.before] - Estado anterior
 * @param {Object} [payload.after] - Estado nuevo
 */
export async function writeAuditLog(req, {
  action,
  entity,
  entityId,
  message,
  before,
  after
}) {
  try {
    const actor = req.user ? {
      userId: req.user._id,
      email: req.user.email,
      role: req.user.role
    } : null;

    // Obtener IP
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;

    const meta = {
      ip,
      userAgent: req.headers['user-agent'],
      origin: req.headers['origin'],
      path: req.originalUrl,
      method: req.method
    };

    await AuditLog.create({
      actor,
      action,
      entity,
      entityId: entityId ? String(entityId) : undefined,
      message,
      before,
      after,
      meta
    });

  } catch (error) {
    // No queremos que un fallo en el log rompa la aplicación, solo lo reportamos al logger del sistema
    logger.error(error, "Error escribiendo AuditLog");
  }
}
