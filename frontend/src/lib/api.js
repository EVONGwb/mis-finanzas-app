import { getToken } from "./auth";

const RAW = import.meta.env.VITE_API_BASE || "";
// Detectar si estamos en producción (dominio real) o desarrollo
const IS_PROD = window.location.hostname !== "localhost";
// IMPORTANTE: Render a veces tarda en despertar, usamos una URL segura
const BASE = RAW || (IS_PROD ? "https://mis-finanzas-app.onrender.com" : "http://localhost:5051");
const BASE_NO_API = BASE.replace(/\/+$/, "").replace(/\/api$/, "");
const API_ROOT = `${BASE_NO_API}/api`;

console.log("[DEBUG] API ROOT:", API_ROOT); // Para ver en la consola del navegador qué URL está usando realmente

const CACHE = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export async function apiFetch(path, { token, method = "GET", body } = {}) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${API_ROOT}${normalizedPath}`;

  const explicitToken =
    typeof token === "string" && token.trim().length > 0 ? token.trim() : null;
  const legacyStoredToken = getToken();
  const legacyToken =
    typeof legacyStoredToken === "string" && legacyStoredToken.trim().length > 0
      ? legacyStoredToken.trim()
      : null;

  const bodyJson = body ? JSON.stringify(body) : undefined;

  const doFetch = async (authHeaderToken) => {
    const headers = { "Content-Type": "application/json" };
    if (authHeaderToken) {
      headers.Authorization = `Bearer ${authHeaderToken}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
    try {
      return await fetch(url, {
        method,
        headers,
        body: bodyJson,
        credentials: "include",
        signal: controller.signal
      });
    } catch (err) {
      if (err?.name === "AbortError") {
        throw new Error("Tiempo de espera agotado (15s). Revisa tu conexión.");
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const primaryAuthToken = explicitToken;
  const primaryCacheKey = `${url}|${primaryAuthToken || ""}`;
  const shouldUseCache = method === "GET";

  if (shouldUseCache) {
    const cached = CACHE.get(primaryCacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
      return cached.data;
    }
  }

  let res = await doFetch(primaryAuthToken);
  let usedAuthToken = primaryAuthToken;

  if (!explicitToken && (res.status === 401 || res.status === 403) && legacyToken) {
    res = await doFetch(legacyToken);
    usedAuthToken = legacyToken;
  }

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!res.ok) {
    const serverMsg = data?.error?.message || data?.message;
    const msg = serverMsg ? `${res.status} - ${serverMsg}` : `${res.status} ${res.statusText}`;
    throw new Error(`Error API: ${msg} - ${url}`);
  }

  // Guardar en caché si es GET exitoso
  if (shouldUseCache) {
    const cacheKey = `${url}|${usedAuthToken || ""}`;
    CACHE.set(cacheKey, { data, timestamp: Date.now() });
  } else {
    // Si modificamos datos (POST, PUT, DELETE), invalidamos caché relacionada
    CACHE.clear();
  }

  return data;
}
