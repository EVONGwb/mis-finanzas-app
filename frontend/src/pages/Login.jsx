import { useMemo, useState, useEffect } from "react";
import { apiFetch } from "../lib/api";
import { Button } from "../components/ui/Button";
import { Fingerprint, ShieldCheck } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";
import { getToken, setToken } from "../lib/auth";
import { useAuth } from "../context/AuthContext";
import { authenticateWithPasskey, isWebAuthnAvailable, registerPasskey, disableBiometricsLocally } from "../lib/webauthn";

export default function Login({ onAuthed }) {
  const { loading: authLoading, unlocked, unlock, fetchUser } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(0);

  // Estados para login tradicional
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const token = getToken();
  const biometricRegistered = localStorage.getItem("biometricRegistered") === "true";
  const canUsePasskey = useMemo(() => isWebAuthnAvailable(), []);

  // Cargar credenciales recordadas
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    const savedPassword = localStorage.getItem("rememberedPassword");
    if (savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

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

  const handleTraditionalLogin = async (e) => {
    if (e) e.preventDefault();
    if (!email || !password) return setError("Introduce usuario y contraseña");

    setLoading(true);
    setError("");

    try {
      const res = await apiFetch("/auth/login", {
        method: "POST",
        body: { email, password }
      });

      if (res.data?.token) {
        setToken(res.data.token);
        
        // Manejar persistencia de credenciales
        if (rememberMe) {
          localStorage.setItem("rememberedEmail", email);
          localStorage.setItem("rememberedPassword", password);
        } else {
          localStorage.removeItem("rememberedEmail");
          localStorage.removeItem("rememberedPassword");
        }

        onAuthed();
      } else {
        setError("Credenciales inválidas");
      }
    } catch (err) {
      setError(err.message || "Error al iniciar sesión");
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
            <form onSubmit={handleTraditionalLogin} style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
              {/* Usuario */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 800, color: "#4B5563", letterSpacing: "0.05em" }}>USUARIO</label>
                <input 
                  type="email"
                  placeholder="tu.usuario"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: "100%",
                    height: "64px",
                    padding: "0 1.5rem",
                    borderRadius: "20px",
                    border: "2px solid #F3F4F6",
                    backgroundColor: "#FFFFFF",
                    fontSize: "1rem",
                    color: "#111827",
                    outline: "none",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#E5E7EB"}
                  onBlur={(e) => e.target.style.borderColor = "#F3F4F6"}
                />
              </div>

              {/* Contraseña */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 800, color: "#4B5563", letterSpacing: "0.05em" }}>CONTRASEÑA</label>
                <input 
                  type="password"
                  placeholder="........"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: "100%",
                    height: "64px",
                    padding: "0 1.5rem",
                    borderRadius: "20px",
                    border: "2px solid #F3F4F6",
                    backgroundColor: "#FFFFFF",
                    fontSize: "1rem",
                    color: "#111827",
                    outline: "none",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#E5E7EB"}
                  onBlur={(e) => e.target.style.borderColor = "#F3F4F6"}
                />
              </div>

              {/* Recordar */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer", color: "#4B5563", fontSize: "0.95rem", fontWeight: 500 }}>
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ 
                      width: "22px", 
                      height: "22px", 
                      borderRadius: "50%", 
                      accentColor: "#111827",
                      cursor: "pointer"
                    }} 
                  />
                  Recordar usuario y contraseña
                </label>

                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", color: "#10B981", fontSize: "0.85rem", fontWeight: 600 }}>
                  <ShieldCheck size={18} />
                  CONEXIÓN SEGURA DE ALTA VELOCIDAD
                </div>
              </div>

              {/* Botón Principal */}
              <Button
                type="submit"
                isLoading={loading}
                style={{
                  width: "100%",
                  height: "68px",
                  fontSize: "1.15rem",
                  fontWeight: 800,
                  borderRadius: "22px",
                  background: "#111827",
                  color: "white",
                  border: "none",
                  boxShadow: "0 12px 30px -8px rgba(17, 24, 39, 0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.75rem",
                  marginTop: "0.5rem"
                }}
              >
                Acceder al Sistema <span style={{ fontSize: "1.3rem" }}>→</span>
              </Button>

              {/* Separador */}
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", margin: "0.5rem 0" }}>
                <div style={{ flex: 1, height: "1px", backgroundColor: "#F3F4F6" }} />
                <span style={{ fontSize: "0.8rem", color: "#9CA3AF", fontWeight: 600 }}>O TAMBIÉN</span>
                <div style={{ flex: 1, height: "1px", backgroundColor: "#F3F4F6" }} />
              </div>

              {/* Botón Google (Compacto) */}
              <button
                type="button"
                onClick={() => googleLogin()}
                disabled={loading}
                style={{ 
                  width: "100%", 
                  height: "56px", 
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  borderRadius: "18px", 
                  backgroundColor: "white",
                  color: "#374151",
                  border: "1px solid #E5E7EB",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.75rem",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#F9FAFB"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "white"}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </button>
            </form>
          )}

          <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", color: "#9CA3AF", fontWeight: 600, fontSize: "0.85rem" }}>
            <span style={{ width: 16, height: 16, borderRadius: 8, border: "1px solid #D1D5DB", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>✓</span>
            Tus datos están protegidos
          </div>
        </div>

      </div>
    </div>
  );
}
