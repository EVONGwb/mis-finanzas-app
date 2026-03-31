const KEY = "token";

export function getToken() {
  return localStorage.getItem(KEY) || sessionStorage.getItem(KEY) || "";
}

export function setToken(token) {
  localStorage.setItem(KEY, token);
  sessionStorage.removeItem(KEY);
}

export function clearToken() {
  localStorage.removeItem(KEY);
  sessionStorage.removeItem(KEY);
}
