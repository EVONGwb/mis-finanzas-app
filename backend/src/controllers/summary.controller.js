import { Income } from "../models/income.model.js";
import { Expense } from "../models/expense.model.js";

function getMonthRange(year, month) {
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 1, 0, 0, 0));
  return { start, end };
}

export async function getSummary(req, res, next) {
  try {
    const now = new Date();
    const year = Number(req.query.year || now.getFullYear());
    const month = Number(req.query.month || (now.getMonth() + 1));

    if (!year || !month || month < 1 || month > 12) {
      return res.status(400).json({ ok: false, error: { message: "Parámetros inválidos (year, month)" } });
    }

    const { start, end } = getMonthRange(year, month);
    const userId = req.user._id;

    const [incomeAgg] = await Income.aggregate([
      { $match: { user: userId, date: { $gte: start, $lt: end } } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } }
    ]);

    const [expenseAgg] = await Expense.aggregate([
      { $match: { user: userId, date: { $gte: start, $lt: end } } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } }
    ]);

    const totalIncome = Number(incomeAgg?.total || 0);
    const totalExpenses = Number(expenseAgg?.total || 0);

    return res.json({
      ok: true,
      data: {
        period: { year, month },
        totals: {
          incomes: totalIncome,
          expenses: totalExpenses,
          balance: totalIncome - totalExpenses
        },
        counts: {
          incomes: Number(incomeAgg?.count || 0),
          expenses: Number(expenseAgg?.count || 0)
        }
      }
    });
  } catch (e) {
    next(e);
  }
}
