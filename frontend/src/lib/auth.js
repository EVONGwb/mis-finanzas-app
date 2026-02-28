const KEY = "token";

export function getToken() {
  return sessionStorage.getItem(KEY) || "";
}

export function setToken(token) {
  sessionStorage.setItem(KEY, token);
}

export function clearToken() {
  sessionStorage.removeItem(KEY);
}
