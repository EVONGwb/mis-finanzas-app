import { MonthlyExpenseTemplate } from "../models/monthlyExpenseTemplate.model.js";
import { MonthlyExpenseInstance } from "../models/monthlyExpenseInstance.model.js";
import { BankMovement } from "../models/bankMovement.model.js";
import { HttpError } from "../utils/httpError.js";

// --- TEMPLATES (CRUD) ---

export const getTemplates = async (req, res, next) => {
  try {
    const templates = await MonthlyExpenseTemplate.find({ user: req.user._id, isActive: true });
    res.json({ ok: true, data: templates });
  } catch (error) {
    next(error);
  }
};

export const createTemplate = async (req, res, next) => {
  try {
    const { name, category, defaultAmount, dueDay, isVariable } = req.body;
    const template = await MonthlyExpenseTemplate.create({
      user: req.user._id,
      name, category, defaultAmount, dueDay, isVariable
    });
    res.status(201).json({ ok: true, data: template });
  } catch (error) {
    next(error);
  }
};

export const updateTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const template = await MonthlyExpenseTemplate.findOneAndUpdate(
      { _id: id, user: req.user._id },
      req.body,
      { new: true }
    );
    if (!template) throw new HttpError(404, "Plantilla no encontrada");
    res.json({ ok: true, data: template });
  } catch (error) {
    next(error);
  }
};

export const deleteTemplate = async (req, res, next) => {
  try {
    // Soft delete (set isActive: false) or Hard delete?
    // Let's do hard delete but warn user. Or soft delete is safer.
    // User requested "Plantillas de gastos mensuales", usually hard delete removes future instances.
    const { id } = req.params;
    const template = await MonthlyExpenseTemplate.findOneAndDelete({ _id: id, user: req.user._id });
    if (!template) throw new HttpError(404, "Plantilla no encontrada");
    
    // Clean up instances? No, keep history.
    res.json({ ok: true, message: "Plantilla eliminada" });
  } catch (error) {
    next(error);
  }
};

// --- INSTANCES (Monthly View) ---

// Get expenses for a specific month (Merge Templates + Instances)
export const getMonthlyStatus = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) throw new HttpError(400, "Mes y año requeridos");

    const m = Number(month);
    const y = Number(year);

    // 1. Get all active templates
    const templates = await MonthlyExpenseTemplate.find({ user: req.user._id, isActive: true }).lean();

    // 2. Get existing instances (confirmations) for this month
    const instances = await MonthlyExpenseInstance.find({ 
      user: req.user._id, 
      month: m, 
      year: y 
    }).lean();

    const instanceMap = new Map(instances.map(i => [i.template.toString(), i]));

    // 3. Merge data
    const result = templates.map(t => {
      const instance = instanceMap.get(t._id.toString());
      return {
        templateId: t._id,
        name: t.name,
        category: t.category,
        dueDay: t.dueDay,
        defaultAmount: t.defaultAmount,
        isVariable: t.isVariable,
        // Status fields
        status: instance ? instance.status : "pending",
        amount: instance ? instance.amount : t.defaultAmount, // If confirmed show real amount, else default
        confirmedAt: instance ? instance.confirmedAt : null,
        instanceId: instance ? instance._id : null
      };
    });

    res.json({ ok: true, data: result });
  } catch (error) {
    next(error);
  }
};

// Confirm payment (Create Instance + Bank Movement)
export const confirmExpense = async (req, res, next) => {
  try {
    const { templateId, month, year, amount } = req.body;
    
    const template = await MonthlyExpenseTemplate.findOne({ _id: templateId, user: req.user._id });
    if (!template) throw new HttpError(404, "Plantilla no encontrada");

    // Check if already confirmed
    const existing = await MonthlyExpenseInstance.findOne({ 
      user: req.user._id, template: templateId, month, year 
    });

    if (existing && existing.status === "confirmed") {
      throw new HttpError(400, "Gasto ya confirmado para este mes");
    }

    const finalAmount = amount !== undefined ? Number(amount) : template.defaultAmount;

    // 1. Create Bank Movement
    const bankMov = await BankMovement.create({
      user: req.user._id,
      type: "expense", // Expense reduces balance
      category: template.category,
      description: `${template.name} - ${month}/${year}`,
      amount: -Math.abs(finalAmount), // Negative for expense
      date: new Date(), // Confirm date is payment date
      relatedModel: "MonthlyExpenseInstance",
      // relatedId: placeholder - will update later
    });

    // 2. Create or Update Instance
    let instance;
    try {
      if (existing) {
        existing.status = "confirmed";
        existing.confirmedAt = new Date();
        existing.amount = finalAmount;
        existing.bankMovement = bankMov._id;
        await existing.save();
        instance = existing;
      } else {
        instance = await MonthlyExpenseInstance.create({
          user: req.user._id,
          template: template._id,
          month,
          year,
          status: "confirmed",
          confirmedAt: new Date(),
          amount: finalAmount,
          bankMovement: bankMov._id
        });
      }
    } catch (dbError) {
      // If instance creation fails (e.g. unique constraint race condition), delete the bank movement to avoid zombie records
      await BankMovement.deleteOne({ _id: bankMov._id });
      throw dbError;
    }

    // Link Bank Movement to Instance
    // Check if bankMov still exists (it might have failed if mongoose validation failed, but create throws error so we are safe)
    // Actually, we need to update bankMov with relatedId.
    await BankMovement.findByIdAndUpdate(bankMov._id, { relatedId: instance._id });

    res.json({ ok: true, data: instance });
  } catch (error) {
    next(error);
  }
};

// Revoke payment (Delete Instance + Bank Movement) - Optional but useful
export const revokeExpense = async (req, res, next) => {
  try {
    const { instanceId } = req.params;
    const instance = await MonthlyExpenseInstance.findOne({ _id: instanceId, user: req.user._id });
    if (!instance) throw new HttpError(404, "Instancia no encontrada");

    // Remove Bank Movement
    if (instance.bankMovement) {
      await BankMovement.deleteOne({ _id: instance.bankMovement });
    }

    // Delete instance (so it goes back to "pending" state in the merged view)
    await instance.deleteOne();

    res.json({ ok: true, message: "Confirmación revertida" });
  } catch (error) {
    next(error);
  }
};
