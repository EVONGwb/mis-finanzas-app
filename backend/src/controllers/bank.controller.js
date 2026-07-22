import { BankMovement } from "../models/bankMovement.model.js";
import { MonthlyClosing } from "../models/monthlyClosing.model.js";
import { WorkEntry } from "../models/workEntry.model.js";
import { Income } from "../models/income.model.js";
import { Expense } from "../models/expense.model.js";
import { Company } from "../models/company.model.js";
import { IncomeReceipt } from "../models/incomeReceipt.model.js";

// Helper to calculate Payroll (Logic from frontend DeliveriesDashboard/getPayrollSummary adapted to backend)
// simplified for total calculation
async function calculatePayroll(userId, year, month) {
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 1, 0, 0, 0));

  // 1. Get Work Entries
  const entries = await WorkEntry.find({ 
    user: userId, 
    date: { $gte: start, $lt: end } 
  }).lean();

  // 2. Group by company to apply specific logic (limits, deductions)
  // This is complex to replicate exactly 1:1 with frontend if logic is there.
  // But we can approximate or duplicate logic.
  // For simplicity and robustness, we should ideally share this logic.
  // Since we are in backend, we'll implement a robust calculation here.

  // Fetch companies
  const companies = await Company.find({ user: userId }).lean();
  const companyMap = companies.reduce((acc, c) => ({ ...acc, [c.name]: c }), {});

  const byCompany = {};

  entries.forEach(entry => {
    if (!byCompany[entry.company]) {
      byCompany[entry.company] = 0;
    }
    byCompany[entry.company] += (entry.total || 0);
  });

  let totalNeto = 0;
  let totalExcedente = 0;

  for (const [compName, totalEarnings] of Object.entries(byCompany)) {
    const company = companyMap[compName];
    if (!company) {
      totalNeto += totalEarnings; // Default to full earning if company not found
      continue;
    }

    // Add supplements
    const supp = company.supplements || {};
    const supTotal = (supp.benefits || 0) + (supp.agreementBonus || 0) + (supp.proratedPayments || 0) + (supp.voluntaryImprovement || 0) + (supp.other || 0);
    
    const totalWithSupp = totalEarnings + supTotal;
    
    let tramoDeducible = totalWithSupp;
    let excedenteLibre = 0;
    
    if (company.limitEnabled && company.limitAmount > 0) {
      if (totalWithSupp > company.limitAmount) {
        tramoDeducible = company.limitAmount;
        excedenteLibre = totalWithSupp - company.limitAmount;
      }
    }

    const ded = company.deductions || {};
    const dCC = (tramoDeducible * (ded.commonContingencies || 0)) / 100;
    const dDA = (tramoDeducible * (ded.unemploymentAccident || 0)) / 100;
    const dIRPF = (tramoDeducible * (ded.irpf || 0)) / 100;
    const dOther = (tramoDeducible * (ded.other || 0)) / 100;
    
    const totalDeducciones = dCC + dDA + dIRPF + dOther;
    const netoNomina = tramoDeducible - totalDeducciones;

    totalNeto += netoNomina;
    totalExcedente += excedenteLibre;
  }

  return { totalNeto, totalExcedente, total: totalNeto + totalExcedente };
}

function monthBoundsUTC(year, month) {
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 1, 0, 0, 0));
  return { start, end };
}

function normalizeMonthSelection(items = []) {
  if (!Array.isArray(items)) return [];
  const seen = new Set();
  const selected = [];

  for (const item of items) {
    const rawYear = typeof item === "string" ? item.slice(0, 4) : item?.year;
    const rawMonth = typeof item === "string" ? item.slice(5, 7) : item?.month;
    const year = Number(rawYear);
    const month = Number(rawMonth);
    const key = `${year}-${String(month).padStart(2, "0")}`;

    if (!Number.isFinite(year) || year < 1970 || year > 3000) continue;
    if (!Number.isFinite(month) || month < 1 || month > 12) continue;
    if (seen.has(key)) continue;

    seen.add(key);
    selected.push({ key, year, month, ...monthBoundsUTC(year, month) });
  }

  return selected;
}

export async function getBankData(req, res, next) {
  try {
    const userId = req.user._id;
    const { month, year, type } = req.query; // Filters

    // 1. Balance Calculation (All time)
    // We can use aggregation to sum all amounts
    const [balanceResult] = await BankMovement.aggregate([
      { $match: { user: userId } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const currentBalance = balanceResult?.total || 0;

    // 2. Movements List
    let filter = { user: userId };
    
    // Date filter if month/year provided (for "Movimientos del mes" view, or just list)
    // The user requirement says "Filtro por mes" in the header.
    if (month && year) {
      const m = Number(month);
      const y = Number(year);
      const start = new Date(Date.UTC(y, m - 1, 1));
      const end = new Date(Date.UTC(y, m, 1));
      filter.date = { $gte: start, $lt: end };
    }

    if (type && type !== "all") {
      // type mapping: 'ingreso' -> income, 'gasto' -> expense, 'cierre' -> category 'cierre_mes'
      if (type === "cierres") {
        filter.category = "cierre_mes";
      } else if (type === "ingresos") {
        filter.type = "income";
      } else if (type === "gastos") {
        filter.type = "expense";
      }
    }

    const movements = await BankMovement.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .lean();

    // 3. Closings List (for the "Cierres" tab)
    // We usually want all closings, or maybe by year? Let's return all for now or filtered by year if provided.
    // User interface shows "Enero 2026: CERRADO", "Febrero 2026: ABIERTO".
    // We should return the list of closed months, and the frontend generates the full list.
    const closings = await MonthlyClosing.find({ user: userId }).sort({ year: -1, month: -1 }).lean();

    // 4. Month Variation (if month/year provided)
    let monthVariation = 0;
    let monthIncomes = 0;
    let monthExpenses = 0;
    if (month && year) {
      const m = Number(month);
      const y = Number(year);
      const start = new Date(Date.UTC(y, m - 1, 1));
      const end = new Date(Date.UTC(y, m, 1));
      
      const monthMovs = await BankMovement.find({ 
        user: userId, 
        date: { $gte: start, $lt: end } 
      }).lean();

      monthVariation = monthMovs.reduce((acc, curr) => acc + curr.amount, 0);
      monthIncomes = monthMovs.filter(m => m.amount > 0).reduce((acc, curr) => acc + curr.amount, 0);
      monthExpenses = monthMovs.filter(m => m.amount < 0).reduce((acc, curr) => acc + curr.amount, 0); // Negative sum
    }

    res.json({
      ok: true,
      data: {
        balance: currentBalance,
        movements,
        closings,
        monthStats: {
          variation: monthVariation,
          incomes: monthIncomes,
          expenses: monthExpenses,
          finalBalance: currentBalance // This is global, but maybe they want "Saldo final del mes" which is Balance at end of month?
          // For simplicity "Saldo final del mes" = Balance if current month, or calculated.
          // Let's stick to current global balance for the big card, and variation for the month.
        }
      }
    });

  } catch (e) {
    next(e);
  }
}

export async function closeMonth(req, res, next) {
  try {
    const userId = req.user._id;
    const { month, year } = req.body;

    if (!month || !year) return res.status(400).json({ ok: false, error: { message: "Falta mes o año" } });

    // 1. Check if already closed
    const existing = await MonthlyClosing.findOne({ user: userId, month, year });
    if (existing) {
      return res.status(400).json({ ok: false, error: { message: "Este mes ya está cerrado" } });
    }

    // 2. Calculate Totals
    // A. Payroll
    const payroll = await calculatePayroll(userId, year, month);
    
    // B. Manual Incomes (Incomes page)
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));
    
    const [incomeAgg] = await Income.aggregate([
      { $match: { user: userId, date: { $gte: start, $lt: end } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const manualIncomes = incomeAgg?.total || 0;

    const totalTransfer = payroll.total + manualIncomes;

    // 3. Create MonthlyClosing
    const closing = await MonthlyClosing.create({
      user: userId,
      month,
      year,
      totalAmount: totalTransfer,
      details: {
        netoNomina: payroll.totalNeto,
        excedenteLibre: payroll.totalExcedente,
        ingresosBrutos: manualIncomes, // Mapping manual incomes here
        gastosMes: 0 // We could calc expenses but they are already deducted from Bank individually. 
        // Just for record keeping we could calculate them.
      },
      isLocked: true
    });

    // 4. Create Bank Movement
    await BankMovement.create({
      user: userId,
      type: "income",
      category: "cierre_mes",
      description: `Cierre ${new Date(0, month - 1).toLocaleString('es-ES', { month: 'long' })} ${year}`,
      amount: totalTransfer,
      date: new Date(), // Closing date is NOW
      relatedId: closing._id,
      relatedModel: "MonthlyClosing"
    });

    res.json({ ok: true, data: closing });

  } catch (e) {
    next(e);
  }
}

export async function openMonth(req, res, next) {
  try {
    const userId = req.user._id;
    const { month, year } = req.body;

    // Check if closed
    const closing = await MonthlyClosing.findOne({ user: userId, month, year });
    if (!closing) {
      return res.status(404).json({ ok: false, error: { message: "Mes no encontrado o no cerrado" } });
    }

    // Remove Bank Movement associated
    await BankMovement.deleteOne({ relatedId: closing._id, relatedModel: "MonthlyClosing" });

    // Remove Closing
    await MonthlyClosing.deleteOne({ _id: closing._id });

    res.json({ ok: true, message: "Mes reabierto correctamente" });

  } catch (e) {
    next(e);
  }
}

export async function resetBankFromMonth(req, res, next) {
  try {
    const userId = req.user._id;
    const { month, year, confirm } = req.body;
    const m = Number(month);
    const y = Number(year);

    if (confirm !== "RESET") {
      return res.status(400).json({ ok: false, error: { message: "Confirmacion requerida" } });
    }
    if (!Number.isFinite(m) || m < 1 || m > 12 || !Number.isFinite(y) || y < 1970) {
      return res.status(400).json({ ok: false, error: { message: "Mes/ano invalido" } });
    }

    const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
    const oldClosings = await MonthlyClosing.find({
      user: userId,
      $or: [
        { year: { $lt: y } },
        { year: y, month: { $lt: m } }
      ]
    }).select({ _id: 1 }).lean();
    const oldClosingIds = oldClosings.map((closing) => closing._id);

    const movementResult = await BankMovement.deleteMany({
      user: userId,
      $or: [
        { date: { $lt: start } },
        { relatedModel: "MonthlyClosing", relatedId: { $in: oldClosingIds } }
      ]
    });

    const closingResult = await MonthlyClosing.deleteMany({
      user: userId,
      _id: { $in: oldClosingIds }
    });

    res.json({
      ok: true,
      data: {
        from: start.toISOString(),
        deletedMovements: movementResult.deletedCount || 0,
        deletedClosings: closingResult.deletedCount || 0
      }
    });
  } catch (e) {
    next(e);
  }
}

export async function listBankIncomeMonths(req, res, next) {
  try {
    const userId = req.user._id;
    const monthMap = new Map();

    const ensureMonth = (year, month) => {
      const key = `${year}-${String(month).padStart(2, "0")}`;
      if (!monthMap.has(key)) {
        monthMap.set(key, {
          key,
          year,
          month,
          total: 0,
          movementsTotal: 0,
          receiptsTotal: 0,
          manualIncomesTotal: 0,
          closingsTotal: 0,
          movementCount: 0,
          receiptCount: 0,
          manualIncomeCount: 0,
          closingCount: 0
        });
      }
      return monthMap.get(key);
    };

    const [movementMonths, receiptMonths, manualIncomeMonths, closingMonths] = await Promise.all([
      BankMovement.aggregate([
        { $match: { user: userId, type: "income" } },
        {
          $group: {
            _id: { year: { $year: "$date" }, month: { $month: "$date" } },
            total: { $sum: "$amount" },
            count: { $sum: 1 }
          }
        }
      ]),
      IncomeReceipt.aggregate([
        { $match: { user: userId } },
        {
          $group: {
            _id: { year: "$year", month: "$month" },
            total: { $sum: "$amountReceived" },
            count: { $sum: 1 }
          }
        }
      ]),
      Income.aggregate([
        { $match: { user: userId } },
        {
          $group: {
            _id: { year: { $year: "$date" }, month: { $month: "$date" } },
            total: { $sum: "$amount" },
            count: { $sum: 1 }
          }
        }
      ]),
      MonthlyClosing.aggregate([
        { $match: { user: userId } },
        {
          $group: {
            _id: { year: "$year", month: "$month" },
            total: { $sum: "$totalAmount" },
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    for (const item of movementMonths) {
      const month = ensureMonth(item._id.year, item._id.month);
      month.movementsTotal += item.total || 0;
      month.total += item.total || 0;
      month.movementCount += item.count || 0;
    }

    for (const item of receiptMonths) {
      const month = ensureMonth(item._id.year, item._id.month);
      month.receiptsTotal += item.total || 0;
      month.receiptCount += item.count || 0;
    }

    for (const item of manualIncomeMonths) {
      const month = ensureMonth(item._id.year, item._id.month);
      month.manualIncomesTotal += item.total || 0;
      month.manualIncomeCount += item.count || 0;
    }

    for (const item of closingMonths) {
      const month = ensureMonth(item._id.year, item._id.month);
      month.closingsTotal += item.total || 0;
      month.closingCount += item.count || 0;
    }

    const data = Array.from(monthMap.values())
      .filter((item) => item.total > 0 || item.receiptsTotal > 0 || item.manualIncomesTotal > 0 || item.closingsTotal > 0)
      .sort((a, b) => b.year - a.year || b.month - a.month);

    res.json({ ok: true, data });
  } catch (e) {
    next(e);
  }
}

export async function resetSelectedIncomeMonths(req, res, next) {
  try {
    const userId = req.user._id;
    const { months, confirm } = req.body;
    const selected = normalizeMonthSelection(months);

    if (confirm !== "RESET") {
      return res.status(400).json({ ok: false, error: { message: "Confirmacion requerida" } });
    }
    if (selected.length === 0) {
      return res.status(400).json({ ok: false, error: { message: "Selecciona al menos un mes valido" } });
    }

    let deletedIncomeReceipts = 0;
    let deletedManualIncomes = 0;
    let deletedClosings = 0;
    let deletedBankMovements = 0;

    for (const item of selected) {
      const [receiptDocs, closingDocs] = await Promise.all([
        IncomeReceipt.find({ user: userId, year: item.year, month: item.month }).select({ _id: 1 }).lean(),
        MonthlyClosing.find({ user: userId, year: item.year, month: item.month }).select({ _id: 1 }).lean()
      ]);
      const receiptIds = receiptDocs.map((doc) => doc._id);
      const closingIds = closingDocs.map((doc) => doc._id);

      const [receiptResult, manualIncomeResult, closingResult, movementResult] = await Promise.all([
        IncomeReceipt.deleteMany({ user: userId, year: item.year, month: item.month }),
        Income.deleteMany({ user: userId, date: { $gte: item.start, $lt: item.end } }),
        MonthlyClosing.deleteMany({ user: userId, year: item.year, month: item.month }),
        BankMovement.deleteMany({
          user: userId,
          $or: [
            { type: "income", date: { $gte: item.start, $lt: item.end } },
            { relatedModel: "IncomeReceipt", relatedId: { $in: receiptIds } },
            { relatedModel: "MonthlyClosing", relatedId: { $in: closingIds } }
          ]
        })
      ]);

      deletedIncomeReceipts += receiptResult.deletedCount || 0;
      deletedManualIncomes += manualIncomeResult.deletedCount || 0;
      deletedClosings += closingResult.deletedCount || 0;
      deletedBankMovements += movementResult.deletedCount || 0;
    }

    res.json({
      ok: true,
      data: {
        months: selected.map(({ key, year, month }) => ({ key, year, month })),
        deletedIncomeReceipts,
        deletedManualIncomes,
        deletedClosings,
        deletedBankMovements
      }
    });
  } catch (e) {
    next(e);
  }
}
