import { Credit } from "../models/credit.model.js";
import { HttpError } from "../utils/httpError.js";

// GET /api/credits
export const getCredits = async (req, res, next) => {
  try {
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

    const credit = await Credit.create({
      user: req.user._id,
      name,
      debtor,
      totalAmount: Number(totalAmount),
      startDate: startDate || new Date(),
      dueDate,
      description
    });

    res.status(201).json({ ok: true, data: credit });
  } catch (error) {
    next(error);
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
      if (key !== 'payments' && key !== 'user') { 
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
