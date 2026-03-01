import { HttpError } from "../utils/httpError.js";

export const requireActiveSubscription = async (req, res, next) => {
  try {
    const user = req.user;
    
    // Si no hay usuario (aunque requireAuth debería haberlo validado antes)
    if (!user) {
      throw new HttpError(401, "No autenticado");
    }

    // Permitir si es status "active" o "trialing"
    const allowedStatuses = ["active", "trialing"];
    const isActive = allowedStatuses.includes(user.subscriptionStatus);
    
    // Verificar fecha de fin de periodo (dar margen de 24h por si acaso)
    const isPeriodValid = user.currentPeriodEnd && new Date(user.currentPeriodEnd) > new Date(Date.now() - 24 * 60 * 60 * 1000);

    if (isActive && isPeriodValid) {
      return next();
    }

    // Si no cumple, bloquear acceso
    return res.status(402).json({
      ok: false,
      error: {
        message: "Suscripción requerida para acceder a esta función",
        code: "subscription_required",
        blocked: true
      }
    });

  } catch (error) {
    next(error);
  }
};
