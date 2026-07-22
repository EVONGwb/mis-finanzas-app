import crypto from "crypto";
import { env } from "../config/env.js";
import { BankConnection } from "../models/bankConnection.model.js";
import { BankSyncTransaction } from "../models/bankSyncTransaction.model.js";
import { Expense } from "../models/expense.model.js";
import { BankMovement } from "../models/bankMovement.model.js";
import { HttpError } from "../utils/httpError.js";

const GOCARDLESS_API = "https://bankaccountdata.gocardless.com/api/v2";
const TRUELAYER_SANDBOX_AUTH = "https://auth.truelayer-sandbox.com";
const TRUELAYER_LIVE_AUTH = "https://auth.truelayer.com";
const TRUELAYER_SANDBOX_DATA = "https://api.truelayer-sandbox.com/data/v1";
const TRUELAYER_LIVE_DATA = "https://api.truelayer.com/data/v1";

function hasTrueLayerConfig() {
  return Boolean(env.TRUELAYER_CLIENT_ID && env.TRUELAYER_CLIENT_SECRET);
}

function hasGoCardlessConfig() {
  return Boolean(env.GOCARDLESS_SECRET_ID && env.GOCARDLESS_SECRET_KEY);
}

function providerName() {
  if (hasTrueLayerConfig()) return "truelayer";
  if (hasGoCardlessConfig()) return "gocardless";
  return "none";
}

function assertOpenBankingConfigured() {
  if (hasTrueLayerConfig() || hasGoCardlessConfig()) return;
  throw new HttpError(
    503,
    "Open Banking no configurado. Faltan credenciales de TrueLayer o GoCardless en Render."
  );
}

function assertGoCardlessConfigured() {
  if (!hasGoCardlessConfig()) {
    throw new HttpError(503, "GoCardless no configurado en Render.");
  }
}

function trueLayerAuthBase() {
  return env.TRUELAYER_ENV === "live" ? TRUELAYER_LIVE_AUTH : TRUELAYER_SANDBOX_AUTH;
}

function trueLayerDataBase() {
  return env.TRUELAYER_ENV === "live" ? TRUELAYER_LIVE_DATA : TRUELAYER_SANDBOX_DATA;
}

async function parseResponse(res, provider) {
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const detail =
      data?.error_description ||
      data?.error_details ||
      data?.detail ||
      data?.summary ||
      data?.message ||
      data?.error ||
      res.statusText;
    throw new HttpError(res.status, `${provider}: ${detail}`);
  }

  return data;
}

async function gocardlessFetch(path, { method = "GET", body, token } = {}) {
  assertGoCardlessConfigured();
  const headers = { Accept: "application/json" };
  if (body) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${GOCARDLESS_API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  return parseResponse(res, "GoCardless");
}

async function getGoCardlessAccessToken() {
  const data = await gocardlessFetch("/token/new/", {
    method: "POST",
    body: {
      secret_id: env.GOCARDLESS_SECRET_ID,
      secret_key: env.GOCARDLESS_SECRET_KEY
    }
  });
  return data.access;
}

async function trueLayerTokenRequest(body) {
  if (!hasTrueLayerConfig()) {
    throw new HttpError(503, "TrueLayer no configurado en Render.");
  }

  const form = new URLSearchParams({
    client_id: env.TRUELAYER_CLIENT_ID,
    client_secret: env.TRUELAYER_CLIENT_SECRET,
    ...body
  });

  const res = await fetch(`${trueLayerAuthBase()}/connect/token`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: form
  });

  return parseResponse(res, "TrueLayer");
}

async function trueLayerFetch(path, token) {
  const res = await fetch(`${trueLayerDataBase()}${path}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`
    }
  });

  return parseResponse(res, "TrueLayer");
}

function getFrontendOrigin(req) {
  const origin = String(req.get("origin") || "").replace(/\/+$/, "");
  return origin || env.FRONTEND_URL.replace(/\/+$/, "");
}

function getGoCardlessRedirectUrl(connectionId, req) {
  return `${getFrontendOrigin(req)}/bank-connected?connection=${connectionId}`;
}

function getTrueLayerRedirectUrl(req) {
  return `${getFrontendOrigin(req)}/bank-connected`;
}

function buildTrueLayerAuthLink(connection, req) {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: env.TRUELAYER_CLIENT_ID,
    scope: env.TRUELAYER_SCOPES,
    redirect_uri: getTrueLayerRedirectUrl(req),
    state: connection.reference
  });

  return `${trueLayerAuthBase()}/?${params.toString()}`;
}

function transactionIdForGoCardless(accountId, transaction) {
  return String(
    transaction.transactionId ||
    transaction.internalTransactionId ||
    transaction.entryReference ||
    transaction.endToEndId ||
    `${accountId}:${transaction.bookingDate || transaction.valueDate}:${transaction.transactionAmount?.amount}:${transaction.remittanceInformationUnstructured || transaction.creditorName || transaction.debtorName || ""}`
  );
}

function descriptionForGoCardless(transaction) {
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

function categoryForGoCardless(transaction) {
  const text = `${transaction.merchantCategoryCode || ""} ${transaction.proprietaryBankTransactionCode || ""}`.toLowerCase();
  if (text.includes("card")) return "tarjeta";
  if (text.includes("cash")) return "efectivo";
  if (text.includes("transfer")) return "transferencia";
  return "banco";
}

function transactionIdForTrueLayer(accountId, transaction) {
  return String(
    transaction.transaction_id ||
    transaction.provider_transaction_id ||
    transaction.meta?.bank_transaction_id ||
    `${accountId}:${transaction.timestamp || transaction.transaction_date}:${transaction.amount}:${transaction.description || transaction.merchant_name || ""}`
  );
}

function descriptionForTrueLayer(transaction) {
  const parts = [
    transaction.merchant_name,
    transaction.description,
    transaction.transaction_category,
    transaction.meta?.provider_transaction_category
  ].filter(Boolean);

  return parts.join(" · ").slice(0, 180) || "Gasto bancario";
}

function categoryForTrueLayer(transaction) {
  const text = `${transaction.transaction_category || ""} ${transaction.description || ""}`.toLowerCase();
  if (text.includes("cash") || text.includes("atm")) return "efectivo";
  if (text.includes("transfer")) return "transferencia";
  if (text.includes("card") || transaction.card_transaction_type) return "tarjeta";
  return "banco";
}

function bookingDateForTrueLayer(transaction) {
  const raw = transaction.timestamp || transaction.transaction_date || transaction.booking_date;
  if (!raw) return null;
  const date = raw.includes("T") ? new Date(raw) : new Date(`${raw}T12:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isTrueLayerExpense(transaction) {
  const amount = Number(transaction.amount);
  if (!Number.isFinite(amount)) return false;
  const type = String(transaction.transaction_type || "").toLowerCase();
  return amount < 0 || type.includes("debit");
}

async function getValidTrueLayerToken(connection) {
  if (
    connection.accessToken &&
    connection.tokenExpiresAt &&
    connection.tokenExpiresAt.getTime() - Date.now() > 60000
  ) {
    return connection.accessToken;
  }

  if (!connection.refreshToken) {
    throw new HttpError(400, "La conexion TrueLayer no tiene refresh token. Autoriza el banco de nuevo.");
  }

  const tokenData = await trueLayerTokenRequest({
    grant_type: "refresh_token",
    refresh_token: connection.refreshToken
  });

  connection.accessToken = tokenData.access_token || "";
  connection.refreshToken = tokenData.refresh_token || connection.refreshToken;
  connection.scope = tokenData.scope || connection.scope || "";
  connection.tokenExpiresAt = tokenData.expires_in
    ? new Date(Date.now() + Number(tokenData.expires_in) * 1000)
    : undefined;
  await connection.save();

  return connection.accessToken;
}

async function importExpense({ userId, connection, accountId, transaction, provider, transactionId, amount, bookingDate, description, category, currency }) {
  const exists = await BankSyncTransaction.findOne({
    user: userId,
    provider,
    accountId,
    transactionId
  }).lean();

  if (exists) return false;

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
    provider,
    accountId,
    transactionId,
    amount,
    currency,
    bookingDate,
    description,
    expense: expense._id,
    bankMovement: bankMovement._id,
    raw: transaction
  });

  return true;
}

async function syncGoCardlessConnection(userId, connection) {
  const token = await getGoCardlessAccessToken();
  let accounts = connection.accounts || [];

  if (accounts.length === 0) {
    const requisition = await gocardlessFetch(`/requisitions/${connection.requisitionId}/`, { token });
    accounts = requisition.accounts || [];
    connection.accounts = accounts;
    connection.status = accounts.length > 0 ? "linked" : "created";
    await connection.save();
  }

  if (accounts.length === 0) {
    throw new HttpError(400, "La cuenta aun no esta autorizada por el banco.");
  }

  let imported = 0;
  let skipped = 0;

  for (const accountId of accounts) {
    const data = await gocardlessFetch(`/accounts/${accountId}/transactions/`, { token });
    const booked = data?.transactions?.booked || [];

    for (const transaction of booked) {
      const rawAmount = Number(transaction.transactionAmount?.amount);
      const dateText = transaction.bookingDate || transaction.valueDate;
      const bookingDate = dateText ? new Date(`${dateText}T12:00:00.000Z`) : null;

      if (!Number.isFinite(rawAmount) || rawAmount >= 0 || !bookingDate || Number.isNaN(bookingDate.getTime())) {
        skipped += 1;
        continue;
      }

      const created = await importExpense({
        userId,
        connection,
        accountId,
        transaction,
        provider: "gocardless",
        transactionId: transactionIdForGoCardless(accountId, transaction),
        amount: Math.abs(rawAmount),
        bookingDate,
        description: descriptionForGoCardless(transaction),
        category: categoryForGoCardless(transaction),
        currency: transaction.transactionAmount?.currency || "EUR"
      });

      if (created) imported += 1;
      else skipped += 1;
    }
  }

  connection.lastSyncedAt = new Date();
  connection.error = "";
  await connection.save();

  return { imported, skipped, accounts: accounts.length, cards: 0 };
}

async function syncTrueLayerResource({ userId, connection, token, accountId, transactionsPath }) {
  const data = await trueLayerFetch(transactionsPath, token);
  const transactions = data?.results || [];
  let imported = 0;
  let skipped = 0;

  for (const transaction of transactions) {
    if (!isTrueLayerExpense(transaction)) {
      skipped += 1;
      continue;
    }

    const amount = Math.abs(Number(transaction.amount));
    const bookingDate = bookingDateForTrueLayer(transaction);

    if (!Number.isFinite(amount) || amount <= 0 || !bookingDate) {
      skipped += 1;
      continue;
    }

    const created = await importExpense({
      userId,
      connection,
      accountId,
      transaction,
      provider: "truelayer",
      transactionId: transactionIdForTrueLayer(accountId, transaction),
      amount,
      bookingDate,
      description: descriptionForTrueLayer(transaction),
      category: categoryForTrueLayer(transaction),
      currency: transaction.currency || "EUR"
    });

    if (created) imported += 1;
    else skipped += 1;
  }

  return { imported, skipped };
}

async function syncTrueLayerConnection(userId, connection) {
  const token = await getValidTrueLayerToken(connection);
  const accountsResponse = await trueLayerFetch("/accounts", token);
  const accounts = accountsResponse?.results || [];
  const accountIds = accounts.map((account) => account.account_id).filter(Boolean);

  let cardIds = connection.cards || [];
  try {
    const cardsResponse = await trueLayerFetch("/cards", token);
    cardIds = (cardsResponse?.results || []).map((card) => card.account_id || card.card_id).filter(Boolean);
  } catch {
    cardIds = [];
  }

  connection.accounts = accountIds;
  connection.cards = cardIds;
  connection.status = accountIds.length > 0 || cardIds.length > 0 ? "linked" : "created";
  await connection.save();

  if (accountIds.length === 0 && cardIds.length === 0) {
    throw new HttpError(400, "TrueLayer no devolvio cuentas ni tarjetas autorizadas.");
  }

  let imported = 0;
  let skipped = 0;

  for (const accountId of accountIds) {
    const result = await syncTrueLayerResource({
      userId,
      connection,
      token,
      accountId,
      transactionsPath: `/accounts/${encodeURIComponent(accountId)}/transactions`
    });
    imported += result.imported;
    skipped += result.skipped;
  }

  for (const cardId of cardIds) {
    const result = await syncTrueLayerResource({
      userId,
      connection,
      token,
      accountId: cardId,
      transactionsPath: `/cards/${encodeURIComponent(cardId)}/transactions`
    });
    imported += result.imported;
    skipped += result.skipped;
  }

  connection.lastSyncedAt = new Date();
  connection.error = "";
  await connection.save();

  return { imported, skipped, accounts: accountIds.length, cards: cardIds.length };
}

export async function getOpenBankingStatus(req, res, next) {
  try {
    res.json({
      ok: true,
      data: {
        provider: providerName(),
        configured: hasTrueLayerConfig() || hasGoCardlessConfig(),
        redirectUri: `${getFrontendOrigin(req)}/bank-connected`
      }
    });
  } catch (e) {
    next(e);
  }
}

export async function listInstitutions(req, res, next) {
  try {
    if (hasTrueLayerConfig()) {
      return res.json({ ok: true, data: [] });
    }

    const country = String(req.query.country || "ES").toUpperCase();
    const token = await getGoCardlessAccessToken();
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
    assertOpenBankingConfigured();
    const userId = req.user._id;
    const activeProvider = providerName();

    if (activeProvider === "truelayer") {
      const reference = `mf-${userId}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
      const connection = await BankConnection.create({
        user: userId,
        provider: "truelayer",
        country: String(req.body.country || "ES").toUpperCase(),
        institutionId: "truelayer",
        institutionName: "TrueLayer",
        requisitionId: reference,
        reference,
        status: "created"
      });

      connection.link = buildTrueLayerAuthLink(connection, req);
      await connection.save();
      return res.status(201).json({ ok: true, data: connection });
    }

    const country = String(req.body.country || "ES").toUpperCase();
    const institutionId = String(req.body.institutionId || "").trim();
    const institutionName = String(req.body.institutionName || "").trim();

    if (!institutionId) {
      return res.status(400).json({ ok: false, error: { message: "Falta institutionId" } });
    }

    const token = await getGoCardlessAccessToken();
    const reference = `mf-${userId}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
    const placeholder = await BankConnection.create({
      user: userId,
      provider: "gocardless",
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
        redirect: getGoCardlessRedirectUrl(placeholder._id, req),
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

export async function handleTrueLayerCallback(req, res, next) {
  try {
    const code = String(req.body.code || "").trim();
    const state = String(req.body.state || "").trim();
    const redirectUri = String(req.body.redirectUri || "").trim();

    if (!code || !state || !redirectUri) {
      return res.status(400).json({ ok: false, error: { message: "Faltan datos de autorizacion bancaria." } });
    }

    const connection = await BankConnection.findOne({
      user: req.user._id,
      provider: "truelayer",
      reference: state
    });

    if (!connection) {
      return res.status(404).json({ ok: false, error: { message: "Conexion TrueLayer no encontrada." } });
    }

    const tokenData = await trueLayerTokenRequest({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri
    });

    connection.accessToken = tokenData.access_token || "";
    connection.refreshToken = tokenData.refresh_token || "";
    connection.scope = tokenData.scope || "";
    connection.tokenExpiresAt = tokenData.expires_in
      ? new Date(Date.now() + Number(tokenData.expires_in) * 1000)
      : undefined;
    connection.status = "linked";
    connection.error = "";

    const token = connection.accessToken;
    try {
      const accountsResponse = await trueLayerFetch("/accounts", token);
      connection.accounts = (accountsResponse?.results || []).map((account) => account.account_id).filter(Boolean);
    } catch (e) {
      connection.error = e.message || "No se pudieron leer las cuentas.";
    }

    try {
      const cardsResponse = await trueLayerFetch("/cards", token);
      connection.cards = (cardsResponse?.results || []).map((card) => card.account_id || card.card_id).filter(Boolean);
    } catch {
      connection.cards = [];
    }

    await connection.save();
    res.json({ ok: true, data: connection });
  } catch (e) {
    next(e);
  }
}

export async function listConnections(req, res, next) {
  try {
    const items = await BankConnection.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .select("-accessToken -refreshToken")
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

    if (connection.provider === "truelayer") {
      const token = await getValidTrueLayerToken(connection);
      const accountsResponse = await trueLayerFetch("/accounts", token);
      connection.accounts = (accountsResponse?.results || []).map((account) => account.account_id).filter(Boolean);
      try {
        const cardsResponse = await trueLayerFetch("/cards", token);
        connection.cards = (cardsResponse?.results || []).map((card) => card.account_id || card.card_id).filter(Boolean);
      } catch {
        connection.cards = [];
      }
      connection.status = connection.accounts.length > 0 || connection.cards.length > 0 ? "linked" : "created";
      connection.error = "";
      await connection.save();
      const sanitized = connection.toObject();
      delete sanitized.accessToken;
      delete sanitized.refreshToken;
      return res.json({ ok: true, data: sanitized });
    }

    const token = await getGoCardlessAccessToken();
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

    const result = connection.provider === "truelayer"
      ? await syncTrueLayerConnection(userId, connection)
      : await syncGoCardlessConnection(userId, connection);

    res.json({ ok: true, data: result });
  } catch (e) {
    next(e);
  }
}

export async function deleteConnection(req, res, next) {
  try {
    const connection = await BankConnection.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!connection) return res.status(404).json({ ok: false, error: { message: "Conexion no encontrada" } });
    const sanitized = connection.toObject();
    delete sanitized.accessToken;
    delete sanitized.refreshToken;
    res.json({ ok: true, data: sanitized });
  } catch (e) {
    next(e);
  }
}
