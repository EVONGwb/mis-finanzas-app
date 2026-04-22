import { useMemo, useState } from "react";
import { apiFetch } from "../lib/api";
import { Button } from "../components/ui/Button";
import { Fingerprint } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";
import { getToken, setToken } from "../lib/auth";
import { useAuth } from "../context/AuthContext";
import { authenticateWithPasskey, isWebAuthnAvailable, registerPasskey, clearSessionAndBiometrics, disableBiometricsLocally } from "../lib/webauthn";

export default function Login({ onAuthed }) {
  const { loading: authLoading, unlocked, unlock, fetchUser } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(0);

  const token = getToken();
  const biometricEnabled = localStorage.getItem("biometricEnabled") === "true" || Boolean(token);
  const biometricRegistered = localStorage.getItem("biometricRegistered") === "true";
  const canUsePasskey = useMemo(() => isWebAuthnAvailable(), []);

  // Mostrar huella si hay token Y el navegador soporta WebAuthn Y no está ya desbloqueado
  // (No dependemos solo de biometricEnabled para cubrir el caso de usuarios que ya tienen token)
  const shouldShowBiometric = Boolean(token) && canUsePasskey && !unlocked;
  const isVerifying = loading || authLoading;

  const handlePasskeyEnter = async () => {
    if (loading) return;
    try {
      setLoading(true);
      setError("");
      if (!biometricRegistered) {
        await registerPasskey();
        localStorage.setItem("biometricRegistered", "true");
        setRefresh((x) => x + 1);
      }
      await authenticateWithPasskey();
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
      background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)", // Fondo degradado suave verde
      padding: "1rem",
      fontFamily: "'Inter', sans-serif"
    }}>
      
      <div style={{ 
        width: "100%", 
        maxWidth: "480px", // Slightly wider for better presence
        backgroundColor: "white", 
        borderRadius: "24px",
        padding: "2.5rem 2rem",
        boxShadow: "0 20px 40px -10px rgba(0,0,0,0.1)", // Sombra elegante
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center"
      }}>
        
        {/* Header Section */}
        <div style={{ marginBottom: "2rem", textAlign: "center", width: "100%" }}>
          <div style={{ 
            height: "100px", // Height based
            width: "auto",
            maxWidth: "280px",
            display: "inline-flex", 
            alignItems: "center", 
            justifyContent: "center",
            marginBottom: "1rem"
          }}>
            <img 
              src="/logo.png?v=1" 
              alt="Mis Finanzas" 
              style={{ width: "100%", height: "100%", objectFit: "contain" }} 
            />
          </div>
          
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#111827", letterSpacing: "-0.02em" }}>
            {shouldShowBiometric ? "Hola de nuevo" : "Bienvenido"}
          </h1>
          <p style={{ color: "#6B7280", fontSize: "0.95rem", lineHeight: 1.5, marginTop: "0.5rem" }}>
            {shouldShowBiometric ? "Accede con tu huella" : "Accede rápido y seguro con tu cuenta de Google"}
          </p>
        </div>

        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "1.25rem" }} key={refresh}>
          {error && (
            <div style={{ 
              padding: "0.75rem", 
              backgroundColor: "#FEF2F2", 
              color: "#EF4444", 
              borderRadius: "10px",
              fontSize: "0.875rem",
              textAlign: "center",
              fontWeight: 500,
              border: "1px solid #FEE2E2"
            }}>
              {error}
            </div>
          )}

          {isVerifying ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "1.25rem 0" }}>
              <div className="animate-spin" style={{ width: 44, height: 44, border: "4px solid #E5E7EB", borderTopColor: "#10B981", borderRadius: "50%" }} />
              <div style={{ color: "#6B7280", fontWeight: 600 }}>Verificando acceso...</div>
            </div>
          ) : shouldShowBiometric ? (
            <>
              <Button
                type="button"
                isLoading={loading}
                onClick={handlePasskeyEnter}
                style={{
                  width: "100%",
                  height: "64px",
                  fontSize: "1.05rem",
                  fontWeight: 800,
                  borderRadius: "16px",
                  background: "#10B981",
                  color: "white",
                  border: "none",
                  boxShadow: "0 6px 18px rgba(16, 185, 129, 0.35)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.75rem"
                }}
              >
                <Fingerprint size={22} />
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
                  cursor: "pointer",
                  padding: 0
                }}
              >
                Usar otra cuenta
              </button>
            </>
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
                borderRadius: "16px", 
                backgroundColor: "white",
                color: "#374151",
                border: "1px solid #E5E7EB",
                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.75rem",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#F9FAFB"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "white"}
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

          {!shouldShowBiometric && (
            <div style={{ textAlign: "center", color: "#6B7280", fontSize: "0.85rem" }}>
              Solo la primera vez necesitarás Google
            </div>
          )}

          <div style={{ marginTop: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", color: "#9CA3AF", fontWeight: 600, fontSize: "0.85rem" }}>
            <span style={{ width: 16, height: 16, borderRadius: 8, border: "1px solid #D1D5DB", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>✓</span>
            Tus datos están protegidos
          </div>
        </div>

      </div>
    </div>
  );
}
