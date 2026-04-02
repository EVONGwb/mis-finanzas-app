import { Company } from "../models/company.model.js";
import { WorkEntry } from "../models/workEntry.model.js";
import { HttpError } from "../utils/httpError.js";

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
        // En aggregation pipelines de MongoDB, si hourlyRateDefault es string, multiply falla.
        const numericRate = Number(hourlyRateDefault);
        override.hourlyRateDefault = numericRate;
      }
      if (deductions) override.deductions = { ...override.deductions, ...deductions };
      if (supplements) override.supplements = { ...override.supplements, ...supplements };
      if (limitRule) override.limitRule = { ...override.limitRule, ...limitRule };

    } else {
      if (hourlyRateDefault !== undefined) {
        const numericRate = Number(hourlyRateDefault);
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
      const numericRate = Number(hourlyRateDefault);
      if (month && year) {
        const m = parseInt(month);
        const y = parseInt(year);
        // Rango del mes exacto
        const startDate = new Date(Date.UTC(y, m - 1, 1));
        const endDate = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
        
        await WorkEntry.updateMany(
          { company: company._id, user: req.user._id, date: { $gte: startDate, $lte: endDate } },
          [
            {
              $set: {
                hourlyRate: numericRate,
                total: { $round: [{ $multiply: ["$hours", numericRate] }, 2] }
              }
            }
          ]
        );
      } else {
        // Si se cambia en la empresa base (sin mes/año), actualizamos todos los que no estén en un mes con override
        // Por simplicidad, y como el usuario pidió "todos los registros del mes", si no hay mes, actualizamos todos.
        await WorkEntry.updateMany(
          { company: company._id, user: req.user._id },
          [
            {
              $set: {
                hourlyRate: numericRate,
                total: { $round: [{ $multiply: ["$hours", numericRate] }, 2] }
              }
            }
          ]
        );
      }
    }
    
    // Devolvemos la versión mergeada para que el frontend no note la diferencia
    const merged = company.toObject();
    if (month && year) {
      const m = parseInt(month);
      const y = parseInt(year);
      const override = merged.monthlyOverrides.find(o => o.month === m && o.year === y);
      Object.assign(merged, {
        hourlyRateDefault: override.hourlyRateDefault,
        deductions: override.deductions,
        supplements: override.supplements,
        limitRule: override.limitRule
      });
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
