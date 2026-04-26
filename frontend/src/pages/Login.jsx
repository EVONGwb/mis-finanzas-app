import { useMemo, useState } from "react";
import { apiFetch } from "../lib/api";
import { Fingerprint } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";
import { getToken, setToken } from "../lib/auth";
import { useAuth } from "../context/AuthContext";
import { authenticateWithPasskey, isWebAuthnAvailable, registerPasskey, disableBiometricsLocally } from "../lib/webauthn";

export default function Login({ onAuthed }) {
  const { loading: authLoading, unlocked, unlock, fetchUser } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [attemptedDeviceSetup, setAttemptedDeviceSetup] = useState(false);
  const [pendingSetup, setPendingSetup] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);

  const token = getToken();
  const canUsePasskey = useMemo(() => isWebAuthnAvailable(), []);

  const lastLoginEmail = localStorage.getItem("lastLoginEmail");
  const shouldShowBiometric = canUsePasskey && !unlocked && (Boolean(token) || Boolean(lastLoginEmail));
  const isVerifying = loading || authLoading;
  const shouldSuggestSetup = canUsePasskey && localStorage.getItem("biometricRegistered") !== "true";

  const handleSetupPasskeyNow = async () => {
    if (setupLoading) return;
    setSetupLoading(true);
    setError("");
    try {
      const token = getToken();
      if (!token) throw new Error("Primero inicia sesión con Google");
      await registerPasskey();
      localStorage.setItem("biometricRegistered", "true");
      onAuthed();
    } catch (e) {
      setError(e?.message || "No se pudo activar la huella");
    } finally {
      setSetupLoading(false);
    }
  };

  const handlePasskeyEnter = async () => {
    if (loading) return;
    try {
      setLoading(true);
      setError("");
      try {
        await authenticateWithPasskey();
      } catch (e) {
        const msg = String(e?.message || "");
        if (msg.includes("No hay huella configurada")) {
          if (!getToken()) throw new Error("No hay huella configurada. Continúa con Google para activarla");
          await registerPasskey();
          localStorage.setItem("biometricRegistered", "true");
          setRefresh((x) => x + 1);
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
            setRefresh((x) => x + 1);
            await authenticateWithPasskey();
          } else if (!token) {
            throw new Error("No se pudo usar la huella. Continúa con Google para activarla en este dispositivo.");
          } else {
            throw new Error("No se pudo usar la huella. Si es la primera vez en este dispositivo, vuelve a iniciar con Google para activar la huella.");
          }
        }

        throw e;
      }
      await fetchUser();
      unlock();
      onAuthed();
    } catch (e) {
      const msg = e?.message || "No se pudo acceder con huella";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleUseOtherAccount = () => {
    setError("");
    disableBiometricsLocally();
    setRefresh((x) => x + 1);
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError("");
      try {
        const res = await apiFetch("/auth/google", {
          method: "POST",
          body: { accessToken: tokenResponse.access_token }
        });

        const token = res.data?.token;
        const email = res.data?.user?.email;
        if (token) {
          setToken(token);
          if (email) localStorage.setItem("lastLoginEmail", String(email).toLowerCase());
          localStorage.setItem("userLoggedIn", "true");
          localStorage.setItem("biometricEnabled", "true");
          if (shouldSuggestSetup) {
            setPendingSetup(true);
          } else {
            onAuthed();
          }
        } else {
          setError("Respuesta inválida del servidor");
        }
      } catch (err) {
        setError(err.message || "Error al iniciar sesión con Google");
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError("Error al conectar con Google")
  });

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
      }} key={refresh}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
          <img
            src="/logo.png?v=2"
            alt="Mis Finanzas"
            style={{ width: 150, height: 150, objectFit: "contain" }}
          />

          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.75rem", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
              <span style={{ color: "var(--color-text)" }}>MIS </span>
              <span style={{ color: "var(--color-primary)" }}>FINANZAS</span>
            </div>
            <div style={{ marginTop: "0.5rem", color: "var(--color-text-secondary)", fontSize: "1rem" }}>
              Controla tu dinero <span style={{ color: "var(--color-primary)", fontWeight: 700 }}>al milímetro</span>
            </div>
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

        {isVerifying ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "1.5rem 0" }}>
            <div className="animate-spin" style={{ width: 44, height: 44, border: "4px solid rgba(148, 163, 184, 0.22)", borderTopColor: "var(--color-primary)", borderRadius: "50%" }} />
            <div style={{ color: "var(--color-text-secondary)", fontWeight: 700 }}>Verificando acceso...</div>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => googleLogin()}
              disabled={loading || setupLoading}
              style={{
                width: "100%",
                height: "64px",
                borderRadius: "var(--radius-full)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                color: "rgba(17, 24, 39, 0.95)",
                fontSize: "1rem",
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.85rem",
                boxShadow: "0 18px 40px rgba(0, 0, 0, 0.35)",
                cursor: loading || setupLoading ? "not-allowed" : "pointer",
                opacity: loading || setupLoading ? 0.7 : 1
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continuar con Google
            </button>

            {pendingSetup && shouldSuggestSetup && (
              <>
                <div style={{
                  width: "100%",
                  padding: "0.95rem 1rem",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "rgba(16, 185, 129, 0.10)",
                  border: "1px solid rgba(16, 185, 129, 0.22)",
                  color: "rgba(255, 255, 255, 0.92)",
                  textAlign: "center",
                  fontWeight: 800
                }}>
                  Sesión iniciada. ¿Activar huella en este dispositivo?
                </div>

                <button
                  type="button"
                  onClick={handleSetupPasskeyNow}
                  disabled={loading || setupLoading}
                  style={{
                    width: "100%",
                    height: "56px",
                    borderRadius: "var(--radius-full)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    backgroundColor: "rgba(16, 185, 129, 0.12)",
                    color: "var(--color-text)",
                    fontSize: "0.95rem",
                    fontWeight: 900,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.75rem",
                    cursor: loading || setupLoading ? "not-allowed" : "pointer",
                    opacity: loading || setupLoading ? 0.7 : 1
                  }}
                >
                  {setupLoading ? "Activando..." : "Activar huella ahora"}
                </button>

                <button
                  type="button"
                  onClick={() => onAuthed()}
                  disabled={loading || setupLoading}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--color-text-tertiary)",
                    fontWeight: 800,
                    fontSize: "0.95rem",
                    cursor: loading || setupLoading ? "not-allowed" : "pointer",
                    padding: 0,
                    opacity: loading || setupLoading ? 0.7 : 1
                  }}
                >
                  Ahora no
                </button>
              </>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", color: "var(--color-text-tertiary)", fontSize: "0.9rem", fontWeight: 600 }}>
              <span style={{ width: 18, height: 18, borderRadius: 9, border: "1px solid rgba(16, 185, 129, 0.55)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--color-primary)", fontSize: 12 }}>✓</span>
              La primera vez inicia sesión con Google
            </div>

            {shouldShowBiometric && (
              <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.8rem", paddingTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={handlePasskeyEnter}
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "1.2rem 1rem",
                    borderRadius: "var(--radius-lg)",
                    backgroundColor: "transparent",
                    border: "1px solid var(--color-glass-border)",
                    boxShadow: "var(--shadow-glow)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "0.65rem",
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.7 : 1
                  }}
                >
                  <div style={{
                    width: 92,
                    height: 92,
                    borderRadius: 46,
                    background: "radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.22) 0%, rgba(16, 185, 129, 0) 65%)",
                    border: "1px solid rgba(16, 185, 129, 0.35)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    <Fingerprint size={42} color="var(--color-primary)" />
                  </div>
                  <div style={{ fontSize: "1rem", fontWeight: 800, color: "var(--color-text)" }}>
                    Entrar con <span style={{ color: "var(--color-primary)" }}>huella</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleUseOtherAccount}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--color-text-tertiary)",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    cursor: "pointer",
                    padding: 0
                  }}
                >
                  Usar otra cuenta
                </button>

                <div style={{ color: "var(--color-text-tertiary)", fontWeight: 700, fontSize: "0.85rem", paddingTop: "0.25rem" }}>
                  Tu información está 100% segura
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
