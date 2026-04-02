import { WorkEntry } from "../models/workEntry.model.js";
import { Company } from "../models/company.model.js";
import { MonthlyClosing } from "../models/monthlyClosing.model.js";
import { HttpError } from "../utils/httpError.js";

function getMonthYearFromISO(iso) {
  const d = new Date(iso);
  return { month: d.getUTCMonth() + 1, year: d.getUTCFullYear() };
}

function getEffectiveRate(company, month, year) {
  const override = company.monthlyOverrides?.find((o) => o.month === month && o.year === year);
  const rate = override?.hourlyRateDefault ?? company.hourlyRateDefault;
  return Number(rate);
}

async function syncWorkEntriesRates({ userId, from, to }) {
  if (!from || !to) return;
  const { month, year } = getMonthYearFromISO(from);
  const locked = await MonthlyClosing.findOne({ user: userId, month, year, isLocked: true }).lean();
  if (locked) return;

  const companies = await Company.find({ user: userId }).select({ hourlyRateDefault: 1, monthlyOverrides: 1 }).lean();
  const rateByCompanyId = new Map(
    companies.map((c) => [String(c._id), getEffectiveRate(c, month, year)])
  );

  const start = new Date(from);
  const end = new Date(to);

  const entries = await WorkEntry.find({
    user: userId,
    date: { $gte: start, $lte: end }
  }).select({ _id: 1, company: 1, hours: 1, hourlyRate: 1, total: 1 }).lean();

  const ops = [];
  for (const e of entries) {
    const rate = rateByCompanyId.get(String(e.company));
    if (!Number.isFinite(rate)) continue;
    const newTotal = Number((Number(e.hours) * rate).toFixed(2));
    if (Number(e.hourlyRate) === rate && Number(e.total) === newTotal) continue;
    ops.push({
      updateOne: {
        filter: { _id: e._id, user: userId },
        update: { $set: { hourlyRate: rate, total: newTotal } }
      }
    });
  }

  if (ops.length > 0) {
    await WorkEntry.bulkWrite(ops, { ordered: false });
  }
}

// GET /api/work-entries
export const getWorkEntries = async (req, res, next) => {
  try {
    const { from, to, companyId, syncRates } = req.query;
    if (syncRates === "1") {
      await syncWorkEntriesRates({ userId: req.user._id, from, to });
    }
    
    const filter = { user: req.user._id };
    if (from && to) {
      filter.date = { $gte: new Date(from), $lte: new Date(to) };
    }
    if (companyId) {
      filter.company = companyId;
    }

    const entries = await WorkEntry.find(filter)
      .populate("company", "name")
      .sort({ date: -1, createdAt: -1 });

    res.json({ ok: true, data: entries });
  } catch (error) {
    next(error);
  }
};

// GET /api/work-entries/dashboard
export const getDashboardStats = async (req, res, next) => {
  try {
    const { from, to, syncRates } = req.query;
    const filter = { user: req.user._id };
    
    if (from && to) {
      filter.date = { $gte: new Date(from), $lte: new Date(to) };
    }

    if (syncRates === "1") {
      await syncWorkEntriesRates({ userId: req.user._id, from, to });
    }

    // Agregación para KPIs
    const stats = await WorkEntry.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalHours: { $sum: "$hours" },
          totalEarnings: { $sum: "$total" },
          count: { $sum: 1 },
          days: { $addToSet: { $dateToString: { format: "%Y-%m-%d", date: "$date" } } }
        }
      }
    ]);

    // Agregación por Empresa
    const byCompany = await WorkEntry.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$company",
          totalHours: { $sum: "$hours" },
          totalEarnings: { $sum: "$total" }
        }
      },
      { $sort: { totalEarnings: -1 } },
      {
        $lookup: {
          from: "companies",
          localField: "_id",
          foreignField: "_id",
          as: "companyInfo"
        }
      },
      { $unwind: "$companyInfo" },
      {
        $project: {
          companyName: "$companyInfo.name",
          totalHours: 1,
          totalEarnings: 1
        }
      }
    ]);

    const kpis = stats[0] || { totalHours: 0, totalEarnings: 0, count: 0, days: [] };
    const uniqueDays = kpis.days.length || 1; // Evitar división por cero

    res.json({
      ok: true,
      data: {
        totalHours: kpis.totalHours,
        totalEarnings: kpis.totalEarnings,
        dailyAverage: kpis.totalEarnings / uniqueDays,
        topCompany: byCompany[0] || null,
        byCompany
      }
    });

  } catch (error) {
    next(error);
  }
};

// Check if month is closed helper
async function isMonthClosed(userId, dateStr) {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const closing = await MonthlyClosing.findOne({ user: userId, month, year, isLocked: true });
  return !!closing;
}

// POST /api/work-entries
export const createWorkEntry = async (req, res, next) => {
  try {
    const { companyId, date, hours, hourlyRate, notes } = req.body;

    if (!companyId || !date || !hours || hourlyRate === undefined) {
      throw new HttpError(400, "Faltan campos obligatorios");
    }

    if (await isMonthClosed(req.user._id, date)) {
      throw new HttpError(403, "El mes está cerrado y no se puede modificar.");
    }

    // Verificar que la empresa existe y pertenece al usuario
    const company = await Company.findOne({ _id: companyId, user: req.user._id });
    if (!company) throw new HttpError(404, "Empresa no encontrada");

    const calculatedTotal = parseFloat((Number(hours) * Number(hourlyRate)).toFixed(2));
    
    console.log("[DEBUG] Creating WorkEntry:", {
      user: req.user._id,
      company: companyId,
      date,
      hours: Number(hours),
      hourlyRate: Number(hourlyRate),
      total: calculatedTotal
    });

    const entry = await WorkEntry.create({
      user: req.user._id,
      company: companyId,
      date,
      hours: Number(hours),
      hourlyRate: Number(hourlyRate),
      total: calculatedTotal,
      notes
    });

    res.status(201).json({ ok: true, data: entry });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/work-entries/:id
export const updateWorkEntry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date, hours, hourlyRate, notes } = req.body;

    const entry = await WorkEntry.findOne({ _id: id, user: req.user._id });
    if (!entry) throw new HttpError(404, "Registro no encontrado");

    // Check if original date's month is closed
    if (await isMonthClosed(req.user._id, entry.date)) {
      throw new HttpError(403, "El mes del registro está cerrado y no se puede modificar.");
    }
    // Check if new date's month is closed (if changing date)
    if (date && await isMonthClosed(req.user._id, date)) {
      throw new HttpError(403, "No se puede mover el registro a un mes cerrado.");
    }

    if (date) entry.date = date;
    if (hours) entry.hours = Number(hours);
    if (hourlyRate !== undefined) entry.hourlyRate = Number(hourlyRate);
    if (notes !== undefined) entry.notes = notes;

    // Recalcular total manualmente ya que quitamos el pre-save
    if (entry.hours !== undefined && entry.hourlyRate !== undefined) {
      entry.total = parseFloat((entry.hours * entry.hourlyRate).toFixed(2));
    }

    await entry.save();

    res.json({ ok: true, data: entry });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/work-entries/:id
export const deleteWorkEntry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const entry = await WorkEntry.findOne({ _id: id, user: req.user._id });
    if (!entry) throw new HttpError(404, "Registro no encontrado");

    if (await isMonthClosed(req.user._id, entry.date)) {
      throw new HttpError(403, "El mes del registro está cerrado y no se puede eliminar.");
    }

    await entry.deleteOne();
    res.json({ ok: true, message: "Registro eliminado" });
  } catch (error) {
    next(error);
  }
};
