import { WorkEntry } from "../models/workEntry.model.js";
import { Company } from "../models/company.model.js";
import { HttpError } from "../utils/httpError.js";

// GET /api/work-entries
export const getWorkEntries = async (req, res, next) => {
  try {
    const { from, to, companyId } = req.query;
    
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
    const { from, to } = req.query;
    const filter = { user: req.user._id };
    
    if (from && to) {
      filter.date = { $gte: new Date(from), $lte: new Date(to) };
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

// POST /api/work-entries
export const createWorkEntry = async (req, res, next) => {
  try {
    const { companyId, date, hours, hourlyRate, notes } = req.body;

    if (!companyId || !date || !hours || hourlyRate === undefined) {
      throw new HttpError(400, "Faltan campos obligatorios");
    }

    // Verificar que la empresa existe y pertenece al usuario
    const company = await Company.findOne({ _id: companyId, user: req.user._id });
    if (!company) throw new HttpError(404, "Empresa no encontrada");

    const entry = await WorkEntry.create({
      user: req.user._id,
      company: companyId,
      date,
      hours,
      hourlyRate,
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

    if (date) entry.date = date;
    if (hours) entry.hours = hours;
    if (hourlyRate !== undefined) entry.hourlyRate = hourlyRate;
    if (notes !== undefined) entry.notes = notes;

    // Recalcular total se hace en el pre-save del modelo
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
    const entry = await WorkEntry.findOneAndDelete({ _id: id, user: req.user._id });
    if (!entry) throw new HttpError(404, "Registro no encontrado");
    res.json({ ok: true, message: "Registro eliminado" });
  } catch (error) {
    next(error);
  }
};
