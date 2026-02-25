import { BankMovement } from "../models/bankMovement.model.js";
import { MonthlyClosing } from "../models/monthlyClosing.model.js";
import { WorkEntry } from "../models/workEntry.model.js";
import { Income } from "../models/income.model.js";
import { Expense } from "../models/expense.model.js";
import { Company } from "../models/company.model.js";

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

import { User } from "../models/user.model.js";

export async function openMonth(req, res, next) {
  try {
    const userId = req.user._id;
    const { month, year, password } = req.body;

    if (!password) {
      return res.status(400).json({ ok: false, error: { message: "Se requiere contraseña para desbloquear." } });
    }

    // Verify password
    const user = await User.findById(userId).select("+password");
    if (!user) return res.status(404).json({ ok: false, error: { message: "Usuario no encontrado" } });

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({ ok: false, error: { message: "Contraseña incorrecta" } });
    }

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
