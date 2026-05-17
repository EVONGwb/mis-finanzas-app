import { IncomeReceipt } from "../models/incomeReceipt.model.js";
import { Company } from "../models/company.model.js";
import { BankMovement } from "../models/bankMovement.model.js";

function monthBoundsUTC(year, month) {
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 1, 0, 0, 0));
  // A stable "receipt date" at end of month (midday to avoid TZ edge cases)
  const receiptDate = new Date(Date.UTC(year, month, 0, 12, 0, 0));
  return { start, end, receiptDate };
}

// GET /api/income-receipts?month=5&year=2026
export async function listIncomeReceipts(req, res, next) {
  try {
    const month = Number(req.query.month);
    const year = Number(req.query.year);
    if (!month || !year) {
      return res.status(400).json({ ok: false, error: { message: "Faltan month/year" } });
    }

    const items = await IncomeReceipt.find({ user: req.user._id, month, year })
      .populate("company", "name")
      .sort({ "company.name": 1, createdAt: -1 });

    res.json({ ok: true, data: items });
  } catch (e) {
    next(e);
  }
}

// POST /api/income-receipts  { companyId, month, year, amountReceived }
export async function upsertIncomeReceipt(req, res, next) {
  try {
    const { companyId, month, year, amountReceived } = req.body;
    if (!companyId) return res.status(400).json({ ok: false, error: { message: "Falta companyId" } });
    if (!month || !year) return res.status(400).json({ ok: false, error: { message: "Faltan month/year" } });
    if (amountReceived === undefined) return res.status(400).json({ ok: false, error: { message: "Falta amountReceived" } });

    const company = await Company.findOne({ _id: companyId, user: req.user._id }).lean();
    if (!company) return res.status(404).json({ ok: false, error: { message: "Empresa no encontrada" } });

    const m = Number(month);
    const y = Number(year);
    const amt = Number(amountReceived);
    if (!Number.isFinite(amt) || amt < 0) return res.status(400).json({ ok: false, error: { message: "amountReceived invalido" } });

    const receipt = await IncomeReceipt.findOneAndUpdate(
      { user: req.user._id, company: companyId, month: m, year: y },
      { $set: { amountReceived: amt } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const { receiptDate } = monthBoundsUTC(y, m);
    const description = `Ingreso recibido - ${company.name} (${String(m).padStart(2, "0")}/${y})`;

    await BankMovement.findOneAndUpdate(
      { user: req.user._id, relatedId: receipt._id, relatedModel: "IncomeReceipt" },
      {
        $set: {
          type: "income",
          category: "income_receipt",
          description,
          amount: amt,
          date: receiptDate
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ ok: true, data: receipt });
  } catch (e) {
    // Duplicate key can happen on upsert races
    if (e?.code === 11000) {
      return res.status(409).json({ ok: false, error: { message: "Ya existe un registro para esa empresa/mes" } });
    }
    next(e);
  }
}

