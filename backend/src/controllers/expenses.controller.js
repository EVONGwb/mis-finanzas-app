import { Expense } from "../models/expense.model.js";
import { BankMovement } from "../models/bankMovement.model.js";

export async function listExpenses(req, res, next) {
  try {
    const filter = req.scopeFilter || { user: req.user._id };
    const items = await Expense.find(filter).sort({ date: -1 }).limit(200);
    res.json({ ok: true, data: items });
  } catch (e) {
    next(e);
  }
}

export async function createExpense(req, res, next) {
  try {
    const { date, amount, category = "general", concept = "", paymentMethod = "cash", type = "daily" } = req.body;

    if (!date) return res.status(400).json({ ok: false, error: { message: "Falta date" } });
    if (amount === undefined) return res.status(400).json({ ok: false, error: { message: "Falta amount" } });

    const created = await Expense.create({
      user: req.user._id,
      date: new Date(date),
      amount: Number(amount),
      category,
      concept,
      paymentMethod,
      type
    });

    // Create Bank Movement (Expense)
    // Expenses reduce bank balance, so amount is negative for balance calculation,
    // but BankMovement logic usually stores absolute amount and type 'expense'.
    // Or signed amount? My BankMovement model comment said: "Positive for income, negative for expense".
    // Let's stick to signed amount for easier aggregation.
    await BankMovement.create({
      user: req.user._id,
      type: "expense",
      category: category,
      description: concept || "Gasto",
      amount: -Math.abs(Number(amount)),
      date: new Date(date),
      relatedId: created._id,
      relatedModel: "Expense"
    });

    res.status(201).json({ ok: true, data: created });
  } catch (e) {
    next(e);
  }
}

export async function deleteExpense(req, res, next) {
  try {
    const filter = req.scopeFilter || { user: req.user._id };
    const deleted = await Expense.findOneAndDelete({ _id: req.params.id, ...filter });
    if (!deleted) return res.status(404).json({ ok: false, error: { message: "No encontrado" } });

    // Remove associated Bank Movement
    await BankMovement.deleteOne({ relatedId: deleted._id, relatedModel: "Expense" });

    res.json({ ok: true, data: deleted });
  } catch (e) {
    next(e);
  }
}