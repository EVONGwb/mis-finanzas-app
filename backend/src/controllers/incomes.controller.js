import { Income } from "../models/income.model.js";

export async function listIncomes(req, res, next) {
  try {
    const filter = { user: req.user._id };
    const items = await Income.find(filter).sort({ date: -1 }).limit(200);
    res.json({ ok: true, data: items });
  } catch (e) {
    next(e);
  }
}

export async function createIncome(req, res, next) {
  try {
    const { date, amount, category = "salary", concept = "", source = "" } = req.body;

    if (!date) return res.status(400).json({ ok: false, error: { message: "Falta date" } });
    if (amount === undefined) return res.status(400).json({ ok: false, error: { message: "Falta amount" } });

    const created = await Income.create({
      user: req.user._id,
      date: new Date(date),
      amount: Number(amount),
      category,
      concept,
      source
    });

    res.status(201).json({ ok: true, data: created });
  } catch (e) {
    next(e);
  }
}

export async function deleteIncome(req, res, next) {
  try {
    const deleted = await Income.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!deleted) return res.status(404).json({ ok: false, error: { message: "No encontrado" } });
    res.json({ ok: true, data: deleted });
  } catch (e) {
    next(e);
  }
}
