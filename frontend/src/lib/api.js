const RAW = import.meta.env.VITE_API_BASE || "";
const BASE = (RAW || "http://localhost:5050").replace(/\/+$/, "");
const BASE_NO_API = BASE.replace(/\/api$/, "");
const API_ROOT = `${BASE_NO_API}/api`;

export async function apiFetch(path, { token, method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${API_ROOT}${normalizedPath}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!res.ok) {
    const msg = `${res.status} ${res.statusText} - ${url}`;
    throw new Error(`Error API: ${msg}`);
  }
  return data;
}
