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

    // --- ACTIVIDAD RECIENTE (Últimos 5 movimientos combinados) ---
    // Traemos un poco más de cada uno para asegurar los 5 más recientes globales
    const recentIncomes = await Income.find({ user: userId })
      .sort({ date: -1, createdAt: -1 })
      .limit(5)
      .lean();

    const recentExpenses = await Expense.find({ user: userId })
      .sort({ date: -1, createdAt: -1 })
      .limit(5)
      .lean();

    // Normalizar para el frontend
    const normalizedIncomes = recentIncomes.map(i => ({
      _id: i._id,
      title: i.description,
      amount: i.amount,
      date: i.date,
      type: "income",
      category: i.category
    }));

    const normalizedExpenses = recentExpenses.map(e => ({
      _id: e._id,
      title: e.description,
      amount: e.amount,
      date: e.date,
      type: "expense",
      category: e.category
    }));

    // Combinar y ordenar
    const recentActivity = [...normalizedIncomes, ...normalizedExpenses]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);


    // --- DATOS PARA GRÁFICO MENSUAL (Agrupado por día) ---
    // Necesitamos un array con todos los días del mes, o al menos los que tienen datos
    // Haremos aggregate para sacar totales por día
    const dailyIncomes = await Income.aggregate([
      { $match: { user: userId, date: { $gte: start, $lt: end } } },
      {
        $group: {
          _id: { $dayOfMonth: "$date" },
          total: { $sum: "$amount" }
        }
      }
    ]);

    const dailyExpenses = await Expense.aggregate([
      { $match: { user: userId, date: { $gte: start, $lt: end } } },
      {
        $group: {
          _id: { $dayOfMonth: "$date" },
          total: { $sum: "$amount" }
        }
      }
    ]);

    // Construir array de días del mes para el gráfico
    const daysInMonth = new Date(year, month, 0).getDate();
    const chartData = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const inc = dailyIncomes.find(i => i._id === d)?.total || 0;
      const exp = dailyExpenses.find(e => e._id === d)?.total || 0;
      chartData.push({
        day: d,
        name: `${d}`, // Etiqueta eje X
        ingresos: inc,
        gastos: exp
      });
    }

    // --- GASTOS POR CATEGORÍA ---
    const expensesByCategory = await Expense.aggregate([
      { $match: { user: userId, date: { $gte: start, $lt: end } } },
      {
        $group: {
          _id: "$category",
          value: { $sum: "$amount" }
        }
      },
      { $project: { name: "$_id", value: 1, _id: 0 } }, // Renombrar _id a name
      { $sort: { value: -1 } }
    ]);

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
        },
        recentActivity,
        chartData,
        expensesByCategory
      }
    });
  } catch (e) {
    next(e);
  }
}
