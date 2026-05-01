import { Debt } from "../models/debt.model.js";
import { randomInt } from "crypto";
import { HttpError } from "../utils/httpError.js";

function generateDebtTrackingCode(length) {
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

  const missing = await Debt.find(missingSelector).select("_id").lean();
  if (!missing.length) return;

  const maxAttempts = 10;
  for (const item of missing) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const trackingCode = generateDebtTrackingCode(6);
      try {
        const updated = await Debt.findOneAndUpdate(
          { _id: item._id, $or: [{ trackingCode: { $exists: false } }, { trackingCode: null }, { trackingCode: "" }] },
          { $set: { trackingCode } },
          { new: true }
        );

        if (updated) break;
        break;
      } catch (err) {
        if (err?.code === 11000) continue;
        throw err;
      }
    }
  }
}

// GET /api/debts
export const getDebts = async (req, res, next) => {
  try {
    await ensureTrackingCodesForUser(req.user._id);
    const debts = await Debt.find({ user: req.user._id })
      .sort({ status: 1, dueDate: 1, createdAt: -1 }); // Activas primero, luego por fecha límite
    
    // Calcular resumen global
    let totalActive = 0;
    let totalPending = 0;
    let totalPaidGlobal = 0;
    let totalDebtAmount = 0;

    debts.forEach(d => {
      if (d.status === 'active') totalActive++;
      totalDebtAmount += d.totalAmount;
      totalPaidGlobal += d.totalPaid;
      totalPending += d.remaining;
    });

    const globalProgress = totalDebtAmount > 0 
      ? (totalPaidGlobal / totalDebtAmount) * 100 
      : 0;

    res.json({
      ok: true,
      data: {
        list: debts,
        summary: {
          totalActive,
          totalPending,
          totalPaidGlobal,
          globalProgress
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/debts
export const createDebt = async (req, res, next) => {
  try {
    const { name, creditor, totalAmount, startDate, dueDate, description } = req.body;

    if (!name || totalAmount === undefined) {
      throw new HttpError(400, "Nombre e importe total son obligatorios");
    }

    const maxAttempts = 10;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const trackingCode = generateDebtTrackingCode(6);
      try {
        const debt = await Debt.create({
          user: req.user._id,
          name,
          creditor,
          totalAmount: Number(totalAmount),
          startDate: startDate || new Date(),
          dueDate,
          description,
          trackingCode
        });

        return res.status(201).json({ ok: true, data: debt });
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

// POST /api/debts/consultar
export const consultarDebtPublic = async (req, res, next) => {
  try {
    const codigo = normalizeCodigo(req.body?.codigo);
    if (!isTrackingCodeValid(codigo)) throw new HttpError(400, "Código inválido");

    const debt = await Debt.findOne({ trackingCode: codigo });
    if (!debt) throw new HttpError(404, "Código no encontrado");

    const total = Math.max(0, Number(debt.totalAmount) || 0);
    const payments = Array.isArray(debt.payments) ? debt.payments : [];
    const totalPaid = Math.max(0, payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0);
    const pagado = Math.min(totalPaid, total);
    const pendiente = Math.max(0, total - pagado);
    const porcentajePagado = total > 0 ? Math.round((pagado / total) * 100) : 100;
    const estado = debt.status === "paid" ? "pagado" : "activo";

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
        tipo: "debt",
        codigo: debt.trackingCode,
        concepto: debt.name,
        personaLabel: "Acreedor",
        persona: debt.creditor,
        total,
        pagado,
        pendiente,
        porcentajePagado,
        fechaInicio: debt.startDate,
        fechaFin: debt.dueDate,
        estado,
        historialPagos
      }
    });
  } catch (error) {
    return next(error);
  }
};

// PATCH /api/debts/:id
export const updateDebt = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Evitar que actualicen pagos directamente por aquí si queremos control estricto, 
    // pero permitiremos edición general.
    
    const debt = await Debt.findOne({ _id: id, user: req.user._id });
    if (!debt) throw new HttpError(404, "Deuda no encontrada");

    Object.keys(updates).forEach(key => {
      if (key !== 'payments' && key !== 'user' && key !== 'trackingCode') { // Protegemos pagos, usuario y código
        debt[key] = updates[key];
      }
    });

    await debt.save();
    res.json({ ok: true, data: debt });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/debts/:id
export const deleteDebt = async (req, res, next) => {
  try {
    const { id } = req.params;
    const debt = await Debt.findOneAndDelete({ _id: id, user: req.user._id });
    if (!debt) throw new HttpError(404, "Deuda no encontrada");
    res.json({ ok: true, message: "Deuda eliminada" });
  } catch (error) {
    next(error);
  }
};

// POST /api/debts/:id/payments
export const addPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount, date, note } = req.body;

    if (!amount || amount <= 0) {
      throw new HttpError(400, "El importe debe ser mayor a 0");
    }

    const debt = await Debt.findOne({ _id: id, user: req.user._id });
    if (!debt) throw new HttpError(404, "Deuda no encontrada");

    debt.payments.push({
      amount: Number(amount),
      date: date || new Date(),
      note
    });
    
    // Recalcular estado manualmente
    const totalPaid = debt.payments.reduce((sum, p) => sum + p.amount, 0);
    if (totalPaid >= debt.totalAmount) {
      debt.status = "paid";
    } else {
      debt.status = "active";
    }

    await debt.save(); 
    res.status(201).json({ ok: true, data: debt });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/debts/:id/payments/:paymentId
export const deletePayment = async (req, res, next) => {
  try {
    const { id, paymentId } = req.params;
    const debt = await Debt.findOne({ _id: id, user: req.user._id });
    if (!debt) throw new HttpError(404, "Deuda no encontrada");

    debt.payments = debt.payments.filter(p => p._id.toString() !== paymentId);

    const totalPaid = debt.payments.reduce((sum, p) => sum + p.amount, 0);
    if (debt.totalAmount > totalPaid) {
      debt.status = "active";
    } else {
      debt.status = "paid";
    }

    await debt.save();

    res.json({ ok: true, data: debt });
  } catch (error) {
    next(error);
  }
};
