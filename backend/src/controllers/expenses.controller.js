import { Expense } from "../models/expense.model.js";

export async function listExpenses(req, res, next) {
  try {
    const filter = { user: req.user._id };
    const items = await Expense.find(filter).sort({ date: -1 }).limit(200);
    res.json({ ok: true, data: items });
  } catch (e) {
    next(e);
  }
}

export async function createExpense(req, res, next) {
  try {
    const { date, amount, category = "general", concept = "", paymentMethod = "cash" } = req.body;

    if (!date) return res.status(400).json({ ok: false, error: { message: "Falta date" } });
    if (amount === undefined) return res.status(400).json({ ok: false, error: { message: "Falta amount" } });

    const created = await Expense.create({
      user: req.user._id,
      date: new Date(date),
      amount: Number(amount),
      category,
      concept,
      paymentMethod
    });

    res.status(201).json({ ok: true, data: created });
  } catch (e) {
    next(e);
  }
}

export async function deleteExpense(req, res, next) {
  try {
    const deleted = await Expense.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!deleted) return res.status(404).json({ ok: false, error: { message: "No encontrado" } });
    res.json({ ok: true, data: deleted });
  } catch (e) {
    next(e);
  }
}
