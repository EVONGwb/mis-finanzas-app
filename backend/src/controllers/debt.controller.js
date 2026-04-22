import { Debt } from "../models/debt.model.js";
import { HttpError } from "../utils/httpError.js";

// GET /api/debts
export const getDebts = async (req, res, next) => {
  try {
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

    const debt = await Debt.create({
      user: req.user._id,
      name,
      creditor,
      totalAmount: Number(totalAmount),
      startDate: startDate || new Date(),
      dueDate,
      description
    });

    res.status(201).json({ ok: true, data: debt });
  } catch (error) {
    next(error);
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
      if (key !== 'payments' && key !== 'user') { // Protegemos pagos y usuario
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
