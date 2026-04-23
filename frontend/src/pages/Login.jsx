import { useMemo, useState } from "react";
import { apiFetch } from "../lib/api";
import { Button } from "../components/ui/Button";
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

  const token = getToken();
  const canUsePasskey = useMemo(() => isWebAuthnAvailable(), []);

  const shouldShowBiometric = Boolean(token) && canUsePasskey && !unlocked;
  const isVerifying = loading || authLoading;

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
          await registerPasskey();
          localStorage.setItem("biometricRegistered", "true");
          setRefresh((x) => x + 1);
          await authenticateWithPasskey();
        } else {
          throw e;
        }
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
        if (token) {
          setToken(token);
          localStorage.setItem("biometricEnabled", "true");
          onAuthed();
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
      background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)", 
      padding: "1rem",
      fontFamily: "'Inter', sans-serif"
    }}>
      
      <div style={{ 
        width: "100%", 
        maxWidth: "460px",
        backgroundColor: "white", 
        borderRadius: "32px",
        padding: "2.5rem 2rem",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.08)",
        display: "flex", 
        flexDirection: "column", 
      }}>
        
        {/* Header Section */}
        <div style={{ marginBottom: "2rem", textAlign: "center", width: "100%" }}>
          <div style={{ 
            height: "80px",
            width: "auto",
            display: "inline-flex", 
            alignItems: "center", 
            justifyContent: "center",
            marginBottom: "1.5rem"
          }}>
            <img 
              src="/logo.png?v=1" 
              alt="Mis Finanzas" 
              style={{ width: "100%", height: "100%", objectFit: "contain" }} 
            />
          </div>
        </div>

        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "1.5rem" }} key={refresh}>
          {error && (
            <div style={{ 
              padding: "1rem", 
              backgroundColor: "#FEF2F2", 
              color: "#EF4444", 
              borderRadius: "16px",
              fontSize: "0.9rem",
              textAlign: "center",
              fontWeight: 600,
              border: "1px solid #FEE2E2"
            }}>
              {error}
            </div>
          )}

          {isVerifying ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem", padding: "2rem 0" }}>
              <div className="animate-spin" style={{ width: 48, height: 48, border: "4px solid #E5E7EB", borderTopColor: "#111827", borderRadius: "50%" }} />
              <div style={{ color: "#4B5563", fontWeight: 700, fontSize: "1.1rem" }}>Verificando acceso...</div>
            </div>
          ) : shouldShowBiometric ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#111827", textAlign: "center", marginBottom: "0.5rem" }}>Hola de nuevo</h2>
              <Button
                type="button"
                isLoading={loading}
                onClick={handlePasskeyEnter}
                style={{
                  width: "100%",
                  height: "64px",
                  fontSize: "1.1rem",
                  fontWeight: 800,
                  borderRadius: "18px",
                  background: "#111827",
                  color: "white",
                  border: "none",
                  boxShadow: "0 10px 25px -5px rgba(17, 24, 39, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.75rem"
                }}
              >
                <Fingerprint size={24} />
                Entrar con huella
              </Button>
              <button
                type="button"
                onClick={handleUseOtherAccount}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#6B7280",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  cursor: "pointer",
                  marginTop: "0.5rem"
                }}
              >
                Usar otra cuenta
              </button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => googleLogin()}
              disabled={loading}
              style={{ 
                width: "100%", 
                height: "64px", 
                fontSize: "1.05rem",
                fontWeight: 700,
                borderRadius: "18px", 
                backgroundColor: "white",
                color: "#374151",
                border: "1px solid #E5E7EB",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.75rem"
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continuar con Google
            </Button>
          )}

        </div>

      </div>
    </div>
  );
}
