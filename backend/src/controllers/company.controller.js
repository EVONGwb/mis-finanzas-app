import { Company } from "../models/company.model.js";
import { WorkEntry } from "../models/workEntry.model.js";
import { MonthlyClosing } from "../models/monthlyClosing.model.js";
import { HttpError } from "../utils/httpError.js";

function parseRate(value) {
  if (value === undefined || value === null) return undefined;
  const str = String(value).trim();
  if (!str) return NaN;
  const match = str.match(/-?\d+(?:[.,]\d+)?/);
  if (!match) return NaN;
  return Number(match[0].replace(",", "."));
}

// GET /api/companies
export const getCompanies = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    let companies = await Company.find({ user: req.user._id })
      .sort({ name: 1 })
      .lean();

    if (month && year) {
      const m = parseInt(month);
      const y = parseInt(year);
      companies = companies.map(company => {
        const override = company.monthlyOverrides?.find(o => o.month === m && o.year === y);
        if (override) {
          return {
            ...company,
            hourlyRateDefault: override.hourlyRateDefault ?? company.hourlyRateDefault,
            deductions: { ...company.deductions, ...override.deductions },
            supplements: { ...company.supplements, ...override.supplements },
            limitRule: { ...company.limitRule, ...override.limitRule }
          };
        }
        return company;
      });
    }

    res.json({ ok: true, data: companies });
  } catch (error) {
    next(error);
  }
};

// POST /api/companies
export const createCompany = async (req, res, next) => {
  try {
    const { name, hourlyRateDefault, description, deductions, supplements, limitRule } = req.body;
    
    // Validación básica
    if (!name || hourlyRateDefault === undefined) {
      throw new HttpError(400, "Nombre y precio/hora son obligatorios");
    }

    const company = await Company.create({
      user: req.user._id,
      name,
      hourlyRateDefault,
      description,
      deductions,
      supplements,
      limitRule
    });

    res.status(201).json({ ok: true, data: company });
  } catch (error) {
    if (error.code === 11000) {
      return next(new HttpError(409, "Ya tienes una empresa con ese nombre"));
    }
    next(error);
  }
};

// PATCH /api/companies/:id
export const updateCompany = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { month, year } = req.query;
    const { name, hourlyRateDefault, isActive, description, deductions, supplements, limitRule } = req.body;

    const company = await Company.findOne({ _id: id, user: req.user._id });
    if (!company) throw new HttpError(404, "Empresa no encontrada");

    // Estos campos base siempre se aplican
    if (name) company.name = name;
    if (isActive !== undefined) company.isActive = isActive;
    if (description !== undefined) company.description = description;
    
    if (month && year) {
      const m = parseInt(month);
      const y = parseInt(year);
      
      let override = company.monthlyOverrides?.find(o => o.month === m && o.year === y);
      if (!override) {
        if (!company.monthlyOverrides) company.monthlyOverrides = [];
        const baseObj = company.toObject();
        company.monthlyOverrides.push({
          month: m,
          year: y,
          hourlyRateDefault: baseObj.hourlyRateDefault,
          deductions: { ...baseObj.deductions },
          supplements: { ...baseObj.supplements },
          limitRule: { ...baseObj.limitRule }
        });
        override = company.monthlyOverrides[company.monthlyOverrides.length - 1];
      }

      if (hourlyRateDefault !== undefined) {
        const numericRate = parseRate(hourlyRateDefault);
        if (!Number.isFinite(numericRate) || numericRate < 0) throw new HttpError(400, "Precio/hora inválido");
        override.hourlyRateDefault = numericRate;
      }
      if (deductions) override.deductions = { ...override.deductions, ...deductions };
      if (supplements) override.supplements = { ...override.supplements, ...supplements };
      if (limitRule) override.limitRule = { ...override.limitRule, ...limitRule };

    } else {
      if (hourlyRateDefault !== undefined) {
        const numericRate = parseRate(hourlyRateDefault);
        if (!Number.isFinite(numericRate) || numericRate < 0) throw new HttpError(400, "Precio/hora inválido");
        company.hourlyRateDefault = numericRate;
      }
      if (deductions) {
        company.deductions = { ...company.toObject().deductions, ...deductions };
      }
      if (supplements) {
        company.supplements = { ...company.toObject().supplements, ...supplements };
      }
      if (limitRule) {
        company.limitRule = { ...company.toObject().limitRule, ...limitRule };
      }
    }

    await company.save();
    
    // Actualizar registros previos si se modifica el precio por hora
    if (hourlyRateDefault !== undefined) {
      const numericRate = parseRate(hourlyRateDefault);
      if (!Number.isFinite(numericRate) || numericRate < 0) throw new HttpError(400, "Precio/hora inválido");
      if (month && year) {
        const m = parseInt(month);
        const y = parseInt(year);
        if (!Number.isFinite(m) || m < 1 || m > 12 || !Number.isFinite(y) || y < 1970) {
          throw new HttpError(400, "Mes/año inválido");
        }

        const locked = await MonthlyClosing.findOne({ user: req.user._id, month: m, year: y, isLocked: true });
        if (locked) throw new HttpError(403, "El mes está cerrado y no se puede modificar.");

        // Rango del mes exacto
        const startDate = new Date(Date.UTC(y, m - 1, 1));
        const endDate = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));

        const entries = await WorkEntry.find({
          company: company._id,
          user: req.user._id,
          date: { $gte: startDate, $lte: endDate }
        }).select({ _id: 1, hours: 1 }).lean();

        if (entries.length > 0) {
          await WorkEntry.bulkWrite(
            entries.map(e => ({
              updateOne: {
                filter: { _id: e._id, user: req.user._id },
                update: {
                  $set: {
                    hourlyRate: numericRate,
                    total: Number((Number(e.hours) * numericRate).toFixed(2))
                  }
                }
              }
            })),
            { ordered: false }
          );
        }
      } else {
        const entries = await WorkEntry.find({
          company: company._id,
          user: req.user._id
        }).select({ _id: 1, hours: 1 }).lean();

        if (entries.length > 0) {
          await WorkEntry.bulkWrite(
            entries.map(e => ({
              updateOne: {
                filter: { _id: e._id, user: req.user._id },
                update: {
                  $set: {
                    hourlyRate: numericRate,
                    total: Number((Number(e.hours) * numericRate).toFixed(2))
                  }
                }
              }
            })),
            { ordered: false }
          );
        }
      }
    }
    
    // Devolvemos la versión mergeada para que el frontend no note la diferencia
    const merged = company.toObject();
    if (month && year) {
      const m = parseInt(month);
      const y = parseInt(year);
      const override = merged.monthlyOverrides.find(o => o.month === m && o.year === y);
      if (override) {
        Object.assign(merged, {
          hourlyRateDefault: override.hourlyRateDefault,
          deductions: override.deductions,
          supplements: override.supplements,
          limitRule: override.limitRule
        });
      }
    }

    res.json({ ok: true, data: merged });
  } catch (error) {
    if (error.code === 11000) {
      return next(new HttpError(409, "Ya tienes una empresa con ese nombre"));
    }
    next(error);
  }
};

// DELETE /api/companies/:id
export const deleteCompany = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Opcional: Verificar si tiene workEntries asociados y bloquear eliminación o hacer soft delete
    const company = await Company.findOneAndDelete({ _id: id, user: req.user._id });
    if (!company) throw new HttpError(404, "Empresa no encontrada");
    res.json({ ok: true, message: "Empresa eliminada" });
  } catch (error) {
    next(error);
  }
};
