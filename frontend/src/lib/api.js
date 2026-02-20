const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5051/api";

export async function apiFetch(path, { token, method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const msg = data?.error?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}
