import { Company } from "../models/company.model.js";
import { HttpError } from "../utils/httpError.js";

// GET /api/companies
export const getCompanies = async (req, res, next) => {
  try {
    const companies = await Company.find({ user: req.user._id })
      .sort({ name: 1 });
    res.json({ ok: true, data: companies });
  } catch (error) {
    next(error);
  }
};

// POST /api/companies
export const createCompany = async (req, res, next) => {
  try {
    const { name, hourlyRateDefault, description } = req.body;
    
    // Validación básica
    if (!name || hourlyRateDefault === undefined) {
      throw new HttpError(400, "Nombre y precio/hora son obligatorios");
    }

    const company = await Company.create({
      user: req.user._id,
      name,
      hourlyRateDefault,
      description
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
    const { name, hourlyRateDefault, isActive, description } = req.body;

    const company = await Company.findOne({ _id: id, user: req.user._id });
    if (!company) throw new HttpError(404, "Empresa no encontrada");

    if (name) company.name = name;
    if (hourlyRateDefault !== undefined) company.hourlyRateDefault = hourlyRateDefault;
    if (isActive !== undefined) company.isActive = isActive;
    if (description !== undefined) company.description = description;

    await company.save();
    res.json({ ok: true, data: company });
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
