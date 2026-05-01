import { Credit } from "../models/credit.model.js";
import { randomInt } from "crypto";
import { HttpError } from "../utils/httpError.js";

function generateCreditTrackingCode(length) {
  const size = Number(length);
  const n = Number.isFinite(size) ? Math.trunc(size) : 6;
  if (n < 6 || n > 10) throw new HttpError(400, "Longitud de código inválida");

  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "MF-";
  for (let i = 0; i < n; i++) out += chars[randomInt(0, chars.length)];
  return out;
}

function normalizeCodigo(value) {
  return String(value || "").trim().toUpperCase();
}

function isTrackingCodeValid(codigo) {
  return /^MF-[A-Z0-9]{6,10}$/.test(codigo);
}

async function ensureTrackingCodesForUser(userId) {
  const missingSelector = {
    user: userId,
    $or: [{ trackingCode: { $exists: false } }, { trackingCode: null }, { trackingCode: "" }]
  };

  const missing = await Credit.find(missingSelector).select("_id").lean();
  if (!missing.length) return;

  const maxAttempts = 10;
  for (const item of missing) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const trackingCode = generateCreditTrackingCode(6);
      try {
        const selector = {
          _id: item._id,
          $or: [{ trackingCode: { $exists: false } }, { trackingCode: null }, { trackingCode: "" }]
        };

        const result = await Credit.updateOne(
          selector,
          { $set: { trackingCode } },
          { overwriteImmutable: true }
        );

        if (result?.modifiedCount === 1) break;
        if (result?.matchedCount === 0) break;
      } catch (err) {
        if (err?.code === 11000) continue;
        throw err;
      }
    }
  }
}

// GET /api/credits
export const getCredits = async (req, res, next) => {
  try {
    await ensureTrackingCodesForUser(req.user._id);
    const credits = await Credit.find({ user: req.user._id })
      .sort({ status: 1, dueDate: 1, createdAt: -1 }); // Activas primero, luego por fecha límite
    
    // Calcular resumen global
    let totalActive = 0;
    let totalPending = 0; // Total que me deben
    let totalCollectedGlobal = 0; // Total que he cobrado
    let totalCreditAmount = 0; // Total prestado/a cobrar

    credits.forEach(c => {
      if (c.status === 'active') totalActive++;
      totalCreditAmount += c.totalAmount;
      totalCollectedGlobal += c.totalPaid;
      totalPending += c.remaining;
    });

    const globalProgress = totalCreditAmount > 0 
      ? (totalCollectedGlobal / totalCreditAmount) * 100 
      : 0;

    res.json({
      ok: true,
      data: {
        list: credits,
        summary: {
          totalActive,
          totalPending,
          totalCollectedGlobal,
          globalProgress
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/credits
export const createCredit = async (req, res, next) => {
  try {
    const { name, debtor, totalAmount, startDate, dueDate, description } = req.body;

    if (!name || !debtor || totalAmount === undefined) {
      throw new HttpError(400, "Nombre, deudor e importe total son obligatorios");
    }

    const maxAttempts = 10;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const trackingCode = generateCreditTrackingCode(6);
      try {
        const credit = await Credit.create({
          user: req.user._id,
          name,
          debtor,
          totalAmount: Number(totalAmount),
          startDate: startDate || new Date(),
          dueDate,
          description,
          trackingCode
        });

        return res.status(201).json({ ok: true, data: credit });
      } catch (err) {
        if (err?.code === 11000) continue;
        throw err;
      }
    }

    throw new HttpError(500, "No se pudo generar un código único");
  } catch (error) {
    next(error);
  }
};

// POST /api/credits/consultar
export const consultarCreditPublic = async (req, res, next) => {
  try {
    const codigo = normalizeCodigo(req.body?.codigo);
    if (!isTrackingCodeValid(codigo)) throw new HttpError(400, "Código inválido");

    const credit = await Credit.findOne({ trackingCode: codigo });
    if (!credit) throw new HttpError(404, "Código no encontrado");

    const total = Math.max(0, Number(credit.totalAmount) || 0);
    const payments = Array.isArray(credit.payments) ? credit.payments : [];
    const totalPaid = Math.max(0, payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0);
    const cobrado = Math.min(totalPaid, total);
    const pendiente = Math.max(0, total - cobrado);
    const porcentajeCobrado = total > 0 ? Math.round((cobrado / total) * 100) : 100;
    const estado = credit.status === "paid" ? "pagado" : "activo";

    const historialPagos = payments
      .slice()
      .sort((a, b) => new Date(b?.date || 0) - new Date(a?.date || 0))
      .slice(0, 20)
      .map((p) => ({
        amount: Math.max(0, Number(p.amount) || 0),
        date: p.date,
        note: p.note || ""
      }));

    return res.json({
      ok: true,
      data: {
        tipo: "credit",
        codigo: credit.trackingCode,
        concepto: credit.name,
        personaLabel: "Deudor",
        persona: credit.debtor,
        total,
        pagado: cobrado,
        pendiente,
        porcentajePagado: porcentajeCobrado,
        fechaInicio: credit.startDate,
        fechaFin: credit.dueDate,
        estado,
        historialPagos
      }
    });
  } catch (error) {
    return next(error);
  }
};

// PATCH /api/credits/:id
export const updateCredit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const credit = await Credit.findOne({ _id: id, user: req.user._id });
    if (!credit) throw new HttpError(404, "Crédito no encontrado");

    Object.keys(updates).forEach(key => {
      if (key !== 'payments' && key !== 'user' && key !== 'trackingCode') { 
        credit[key] = updates[key];
      }
    });

    await credit.save();
    res.json({ ok: true, data: credit });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/credits/:id
export const deleteCredit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const credit = await Credit.findOneAndDelete({ _id: id, user: req.user._id });
    if (!credit) throw new HttpError(404, "Crédito no encontrado");
    res.json({ ok: true, message: "Crédito eliminado" });
  } catch (error) {
    next(error);
  }
};

// POST /api/credits/:id/payments
export const addPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount, date, note } = req.body;

    if (!amount || amount <= 0) {
      throw new HttpError(400, "El importe debe ser mayor a 0");
    }

    const credit = await Credit.findOne({ _id: id, user: req.user._id });
    if (!credit) throw new HttpError(404, "Crédito no encontrado");

    credit.payments.push({
      amount: Number(amount),
      date: date || new Date(),
      note
    });
    
    // Recalcular estado manualmente
    const totalPaid = credit.payments.reduce((sum, p) => sum + p.amount, 0);
    if (totalPaid >= credit.totalAmount) {
      credit.status = "paid";
    } else {
      credit.status = "active";
    }

    await credit.save(); 
    res.status(201).json({ ok: true, data: credit });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/credits/:id/payments/:paymentId
export const deletePayment = async (req, res, next) => {
  try {
    const { id, paymentId } = req.params;
    const credit = await Credit.findOne({ _id: id, user: req.user._id });
    if (!credit) throw new HttpError(404, "Crédito no encontrado");

    credit.payments = credit.payments.filter(p => p._id.toString() !== paymentId);
    
    // Recalcular estado tras borrar pago
    const totalPaid = credit.payments.reduce((sum, p) => sum + p.amount, 0);
    if (totalPaid >= credit.totalAmount) {
      credit.status = "paid";
    } else {
      credit.status = "active";
    }

    await credit.save();

    res.json({ ok: true, data: credit });
  } catch (error) {
    next(error);
  }
};
