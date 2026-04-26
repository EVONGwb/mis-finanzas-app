import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Fingerprint } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";
import { apiFetch } from "../lib/api";
import { clearToken, getToken, setToken } from "../lib/auth";
import { useAuth } from "../context/AuthContext";
import { authenticateWithPasskey, disableBiometricsLocally, isWebAuthnAvailable, registerPasskey } from "../lib/webauthn";

export default function Unlock() {
  const { fetchUser, unlock } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [attemptedDeviceSetup, setAttemptedDeviceSetup] = useState(false);

  const canUsePasskey = useMemo(() => isWebAuthnAvailable(), []);

  const from = location.state?.from?.pathname || "/dashboard";

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError("");
      try {
        const res = await apiFetch("/auth/google", {
          method: "POST",
          body: { accessToken: tokenResponse.access_token }
        });
        const newToken = res.data?.token;
        const email = res.data?.user?.email;
        if (!newToken) throw new Error("Respuesta inválida del servidor");
        setToken(newToken);
        if (email) localStorage.setItem("lastLoginEmail", String(email).toLowerCase());
        localStorage.setItem("userLoggedIn", "true");
        localStorage.setItem("biometricEnabled", "true");
        await fetchUser();
        unlock();
        navigate(from, { replace: true });
      } catch (e) {
        setError(e?.message || "Error al iniciar sesión con Google");
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError("Error al conectar con Google")
  });

  const handlePasskey = async () => {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      if (!canUsePasskey) {
        throw new Error("Este dispositivo no soporta huella/biometría");
      }
      try {
        await authenticateWithPasskey();
      } catch (e) {
        const msg = String(e?.message || "");
        if (msg.includes("No hay huella configurada")) {
          await registerPasskey();
          localStorage.setItem("biometricRegistered", "true");
          await authenticateWithPasskey();
        }

        const name = String(e?.name || "");
        const isNotAllowed = name === "NotAllowedError" || msg.includes("timed out") || msg.includes("not allowed");
        if (isNotAllowed) {
          const token = getToken();
          const alreadyRegistered = localStorage.getItem("biometricRegistered") === "true";
          if (token && !alreadyRegistered && !attemptedDeviceSetup) {
            setAttemptedDeviceSetup(true);
            await registerPasskey();
            localStorage.setItem("biometricRegistered", "true");
            await authenticateWithPasskey();
          } else if (!token) {
            throw new Error("No se pudo usar la huella. Pulsa “Continuar con Google” para activarla en este dispositivo.");
          } else {
            throw new Error("No se pudo usar la huella. Si es la primera vez en este dispositivo, pulsa “Continuar con Google” y luego activa la huella.");
          }
        }

        throw e;
      }
      await fetchUser();
      unlock();
      navigate(from, { replace: true });
    } catch (e) {
      setError(e?.message || "No se pudo acceder con huella");
    } finally {
      setLoading(false);
    }
  };

  const handleUseGoogle = () => {
    disableBiometricsLocally();
    clearToken();
    googleLogin();
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1.5rem",
      fontFamily: "var(--font-family)"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "420px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1.25rem",
        padding: "1.75rem 1.25rem",
        borderRadius: "var(--radius-lg)",
        backgroundColor: "rgba(6, 15, 23, 0.35)",
        border: "1px solid var(--color-glass-border)",
        boxShadow: "var(--shadow-lg)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)"
      }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.6rem" }}>
          <div style={{
            width: 110,
            height: 110,
            borderRadius: 55,
            background: "radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.22) 0%, rgba(16, 185, 129, 0) 65%)",
            border: "1px solid rgba(16, 185, 129, 0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <Fingerprint size={54} color="var(--color-primary)" />
          </div>
          <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "var(--color-text)" }}>
            Desbloquear con huella
          </div>
          <div style={{ color: "var(--color-text-secondary)", fontWeight: 700, textAlign: "center" }}>
            Accede rápido y seguro
          </div>
        </div>

        {error && (
          <div style={{
            width: "100%",
            padding: "0.9rem 1rem",
            backgroundColor: "var(--color-danger-bg)",
            color: "rgba(255, 255, 255, 0.92)",
            borderRadius: "var(--radius-md)",
            fontSize: "0.9rem",
            textAlign: "center",
            fontWeight: 600,
            border: "1px solid rgba(239, 68, 68, 0.35)"
          }}>
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handlePasskey}
          disabled={loading}
          style={{
            width: "100%",
            height: "64px",
            borderRadius: "var(--radius-full)",
            border: "1px solid var(--color-glass-border)",
            backgroundColor: "rgba(16, 185, 129, 0.12)",
            color: "var(--color-text)",
            fontSize: "1rem",
            fontWeight: 900,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.7rem",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? "Verificando..." : "Usar huella"}
        </button>

        <button
          type="button"
          onClick={handleUseGoogle}
          disabled={loading}
          style={{
            width: "100%",
            height: "56px",
            borderRadius: "var(--radius-full)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            color: "rgba(17, 24, 39, 0.95)",
            fontSize: "0.95rem",
            fontWeight: 900,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.75rem",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1
          }}
        >
          Continuar con Google
        </button>
      </div>
    </div>
  );
}
