import { startAuthentication, startRegistration } from "@simplewebauthn/browser";
import { apiFetch } from "./api";
import { getToken, setToken, clearToken } from "./auth";

export function isWebAuthnAvailable() {
  return (
    typeof window !== "undefined" &&
    "PublicKeyCredential" in window &&
    typeof navigator !== "undefined" &&
    typeof navigator.credentials?.get === "function" &&
    typeof navigator.credentials?.create === "function"
  );
}

export async function registerPasskey() {
  const token = getToken();
  if (!token) throw new Error("No hay sesión");

  const optionsRes = await apiFetch("/auth/webauthn/register/options", { token });
  const attResp = await startRegistration(optionsRes.data);

  const verifyRes = await apiFetch("/auth/webauthn/register/verify", {
    method: "POST",
    token,
    body: attResp
  });

  return verifyRes.data;
}

export async function authenticateWithPasskey() {
  const token = getToken();
  const email = localStorage.getItem("lastLoginEmail");
  const qs = token ? "" : (email ? `?email=${encodeURIComponent(email)}` : "");
  if (!token && !email) throw new Error("No hay sesión guardada. Continúa con Google");

  const optionsRes = await apiFetch(`/auth/webauthn/login/options${qs}`, token ? { token } : undefined);
  const asseResp = await startAuthentication(optionsRes.data);

  const verifyRes = await apiFetch(`/auth/webauthn/login/verify${qs}`, {
    method: "POST",
    token,
    body: token ? asseResp : { ...asseResp, email }
  });

  const newToken = verifyRes.data?.token;
  if (newToken) setToken(newToken);
  return verifyRes.data;
}

export function disableBiometricsLocally() {
  localStorage.removeItem("biometricEnabled");
  localStorage.removeItem("biometricRegistered");
  sessionStorage.removeItem("biometricUnlocked");
}

export function clearSessionAndBiometrics() {
  clearToken();
  localStorage.removeItem("user");
  sessionStorage.removeItem("user");
  // Only remove unlock state, keep biometricEnabled so it knows to ask again
  sessionStorage.removeItem("biometricUnlocked");
}
