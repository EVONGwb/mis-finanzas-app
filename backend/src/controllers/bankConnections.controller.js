import crypto from "crypto";
import { env } from "../config/env.js";
import { BankConnection } from "../models/bankConnection.model.js";
import { BankSyncTransaction } from "../models/bankSyncTransaction.model.js";
import { Expense } from "../models/expense.model.js";
import { BankMovement } from "../models/bankMovement.model.js";
import { HttpError } from "../utils/httpError.js";

const GOCARDLESS_API = "https://bankaccountdata.gocardless.com/api/v2";

function assertConfigured() {
  if (!env.GOCARDLESS_SECRET_ID || !env.GOCARDLESS_SECRET_KEY) {
    throw new HttpError(503, "Open Banking no configurado. Faltan GOCARDLESS_SECRET_ID y GOCARDLESS_SECRET_KEY en Render.");
  }
}

async function gocardlessFetch(path, { method = "GET", body, token } = {}) {
  assertConfigured();
  const headers = { Accept: "application/json" };
  if (body) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${GOCARDLESS_API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const detail = data?.detail || data?.summary || data?.message || res.statusText;
    throw new HttpError(res.status, `GoCardless: ${detail}`);
  }

  return data;
}

async function getAccessToken() {
  const data = await gocardlessFetch("/token/new/", {
    method: "POST",
    body: {
      secret_id: env.GOCARDLESS_SECRET_ID,
      secret_key: env.GOCARDLESS_SECRET_KEY
    }
  });
  return data.access;
}

function getRedirectUrl(connectionId, req) {
  const origin = String(req.get("origin") || "").replace(/\/+$/, "");
  const base = origin || env.FRONTEND_URL.replace(/\/+$/, "");
  return `${base}/bank-connected?connection=${connectionId}`;
}

function transactionIdFor(accountId, transaction) {
  return String(
    transaction.transactionId ||
    transaction.internalTransactionId ||
    transaction.entryReference ||
    transaction.endToEndId ||
    `${accountId}:${transaction.bookingDate || transaction.valueDate}:${transaction.transactionAmount?.amount}:${transaction.remittanceInformationUnstructured || transaction.creditorName || transaction.debtorName || ""}`
  );
}

function descriptionFor(transaction) {
  const parts = [
    transaction.creditorName,
    transaction.remittanceInformationUnstructured,
    Array.isArray(transaction.remittanceInformationUnstructuredArray)
      ? transaction.remittanceInformationUnstructuredArray.join(" ")
      : "",
    transaction.additionalInformation,
    transaction.proprietaryBankTransactionCode
  ].filter(Boolean);

  return parts.join(" · ").slice(0, 180) || "Gasto bancario";
}

function categoryFor(transaction) {
  const text = `${transaction.merchantCategoryCode || ""} ${transaction.proprietaryBankTransactionCode || ""}`.toLowerCase();
  if (text.includes("card")) return "tarjeta";
  if (text.includes("cash")) return "efectivo";
  if (text.includes("transfer")) return "transferencia";
  return "banco";
}

export async function getOpenBankingStatus(req, res, next) {
  try {
    res.json({
      ok: true,
      data: {
        provider: "gocardless",
        configured: Boolean(env.GOCARDLESS_SECRET_ID && env.GOCARDLESS_SECRET_KEY)
      }
    });
  } catch (e) {
    next(e);
  }
}

export async function listInstitutions(req, res, next) {
  try {
    const country = String(req.query.country || "ES").toUpperCase();
    const token = await getAccessToken();
    const institutions = await gocardlessFetch(`/institutions/?country=${encodeURIComponent(country)}`, { token });

    res.json({
      ok: true,
      data: institutions.map((item) => ({
        id: item.id,
        name: item.name,
        bic: item.bic,
        logo: item.logo,
        transactionTotalDays: item.transaction_total_days
      }))
    });
  } catch (e) {
    next(e);
  }
}

export async function createConnection(req, res, next) {
  try {
    const userId = req.user._id;
    const country = String(req.body.country || "ES").toUpperCase();
    const institutionId = String(req.body.institutionId || "").trim();
    const institutionName = String(req.body.institutionName || "").trim();

    if (!institutionId) {
      return res.status(400).json({ ok: false, error: { message: "Falta institutionId" } });
    }

    const token = await getAccessToken();
    const reference = `mf-${userId}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
    const placeholder = await BankConnection.create({
      user: userId,
      country,
      institutionId,
      institutionName,
      requisitionId: `pending-${reference}`,
      reference,
      status: "created"
    });

    const requisition = await gocardlessFetch("/requisitions/", {
      method: "POST",
      token,
      body: {
        redirect: getRedirectUrl(placeholder._id, req),
        institution_id: institutionId,
        reference,
        user_language: "ES"
      }
    });

    placeholder.requisitionId = requisition.id;
    placeholder.link = requisition.link || "";
    placeholder.accounts = requisition.accounts || [];
    await placeholder.save();

    res.status(201).json({ ok: true, data: placeholder });
  } catch (e) {
    next(e);
  }
}

export async function listConnections(req, res, next) {
  try {
    const items = await BankConnection.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ ok: true, data: items });
  } catch (e) {
    next(e);
  }
}

export async function refreshConnection(req, res, next) {
  try {
    const connection = await BankConnection.findOne({ _id: req.params.id, user: req.user._id });
    if (!connection) return res.status(404).json({ ok: false, error: { message: "Conexion no encontrada" } });

    const token = await getAccessToken();
    const requisition = await gocardlessFetch(`/requisitions/${connection.requisitionId}/`, { token });
    connection.accounts = requisition.accounts || [];
    connection.status = connection.accounts.length > 0 ? "linked" : "created";
    connection.error = "";
    await connection.save();

    res.json({ ok: true, data: connection });
  } catch (e) {
    next(e);
  }
}

export async function syncConnection(req, res, next) {
  try {
    const userId = req.user._id;
    const connection = await BankConnection.findOne({ _id: req.params.id, user: userId });
    if (!connection) return res.status(404).json({ ok: false, error: { message: "Conexion no encontrada" } });

    const token = await getAccessToken();
    let accounts = connection.accounts || [];

    if (accounts.length === 0) {
      const requisition = await gocardlessFetch(`/requisitions/${connection.requisitionId}/`, { token });
      accounts = requisition.accounts || [];
      connection.accounts = accounts;
      connection.status = accounts.length > 0 ? "linked" : "created";
      await connection.save();
    }

    if (accounts.length === 0) {
      return res.status(400).json({ ok: false, error: { message: "La cuenta aun no esta autorizada por el banco" } });
    }

    let imported = 0;
    let skipped = 0;

    for (const accountId of accounts) {
      const data = await gocardlessFetch(`/accounts/${accountId}/transactions/`, { token });
      const booked = data?.transactions?.booked || [];

      for (const transaction of booked) {
        const rawAmount = Number(transaction.transactionAmount?.amount);
        if (!Number.isFinite(rawAmount) || rawAmount >= 0) {
          skipped += 1;
          continue;
        }

        const transactionId = transactionIdFor(accountId, transaction);
        const exists = await BankSyncTransaction.findOne({
          user: userId,
          provider: "gocardless",
          accountId,
          transactionId
        }).lean();

        if (exists) {
          skipped += 1;
          continue;
        }

        const dateText = transaction.bookingDate || transaction.valueDate;
        if (!dateText) {
          skipped += 1;
          continue;
        }

        const bookingDate = new Date(`${dateText}T12:00:00.000Z`);
        if (Number.isNaN(bookingDate.getTime())) {
          skipped += 1;
          continue;
        }
        const amount = Math.abs(rawAmount);
        const description = descriptionFor(transaction);
        const category = categoryFor(transaction);

        const expense = await Expense.create({
          user: userId,
          date: bookingDate,
          amount,
          category,
          concept: description,
          paymentMethod: "bank",
          type: "daily"
        });

        const bankMovement = await BankMovement.create({
          user: userId,
          type: "expense",
          category,
          description,
          amount: -amount,
          date: bookingDate,
          relatedId: expense._id,
          relatedModel: "Expense"
        });

        await BankSyncTransaction.create({
          user: userId,
          connection: connection._id,
          provider: "gocardless",
          accountId,
          transactionId,
          amount,
          currency: transaction.transactionAmount?.currency || "EUR",
          bookingDate,
          description,
          expense: expense._id,
          bankMovement: bankMovement._id,
          raw: transaction
        });

        imported += 1;
      }
    }

    connection.lastSyncedAt = new Date();
    connection.error = "";
    await connection.save();

    res.json({ ok: true, data: { imported, skipped, accounts: accounts.length } });
  } catch (e) {
    next(e);
  }
}

export async function deleteConnection(req, res, next) {
  try {
    const connection = await BankConnection.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!connection) return res.status(404).json({ ok: false, error: { message: "Conexion no encontrada" } });
    res.json({ ok: true, data: connection });
  } catch (e) {
    next(e);
  }
}
