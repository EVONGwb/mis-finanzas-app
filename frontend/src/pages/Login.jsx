import { useState } from "react";
import { apiFetch } from "../lib/api";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Mail, Lock, Eye, EyeOff, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";

export default function Login({ onAuthed }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
        const user = res.data?.user;

        if (token) {
          localStorage.setItem("token", token);
          if (user) {
            localStorage.setItem("user", JSON.stringify(user));
          }
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

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiFetch("/auth/login", {
        method: "POST",
        body: { email, password }
      });
      
      const token = res.data?.token;
      const user = res.data?.user;

      if (token) {
        localStorage.setItem("token", token);
        if (user) {
          localStorage.setItem("user", JSON.stringify(user));
        }
        onAuthed();
      } else {
        setError("Respuesta inválida del servidor");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

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
            width: "56px", height: "56px", 
            borderRadius: "14px", 
            background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
            display: "inline-flex", 
            alignItems: "center", 
            justifyContent: "center",
            color: "white",
            marginBottom: "1.5rem",
            boxShadow: "0 8px 16px -4px rgba(16, 185, 129, 0.4)"
          }}>
            <TrendingUp size={28} strokeWidth={2.5} />
          </div>
          
          <h1 style={{ 
            fontSize: "1.75rem", 
            fontWeight: 800, 
            color: "#111827", 
            marginBottom: "0.5rem",
            letterSpacing: "-0.02em"
          }}>
            Bienvenido de nuevo
          </h1>
          <p style={{ 
            color: "#6B7280", 
            fontSize: "0.95rem",
            lineHeight: 1.5
          }}>
            Ingresa a tu cuenta para continuar
          </p>
        </div>

        {/* Form Section */}
        <form onSubmit={submit} style={{ width: "100%", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label style={{ fontSize: "0.875rem", fontWeight: 600, color: "#374151", marginLeft: "0.25rem" }}>
              Correo electrónico
            </label>
            <Input 
              icon={Mail}
              iconColor="#9CA3AF" // Icono gris sutil
              type="email" 
              placeholder="ejemplo@correo.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required
              style={{ 
                height: "60px", // Increased height for better comfort
                fontSize: "1.05rem", // Slightly larger font
                borderRadius: "12px",
                backgroundColor: "#F9FAFB", // Fondo gris muy claro
                border: "1px solid #E5E7EB",
                boxShadow: "none"
              }}
            />
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label style={{ fontSize: "0.875rem", fontWeight: 600, color: "#374151", marginLeft: "0.25rem" }}>
              Contraseña
            </label>
            <Input 
              icon={Lock}
              iconColor="#9CA3AF"
              type={showPassword ? "text" : "password"} 
              placeholder="••••••••" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required
              style={{ 
                height: "60px", // Increased height for better comfort
                fontSize: "1.05rem", // Slightly larger font
                borderRadius: "12px",
                backgroundColor: "#F9FAFB",
                border: "1px solid #E5E7EB",
                boxShadow: "none"
              }}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#9CA3AF",
                    display: "flex",
                    alignItems: "center",
                    padding: "0.25rem",
                    transition: "color 0.2s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "#4B5563"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "#9CA3AF"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />
            <div style={{ textAlign: "right", marginTop: "0.25rem" }}>
              <button
                type="button"
                style={{
                  fontSize: "0.8rem",
                  color: "#10B981", // Enlace verde
                  fontWeight: 600,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: 0
                }}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          </div>

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

          <Button 
            type="submit" 
            isLoading={loading} 
            style={{ 
              width: "100%", 
              marginTop: "0.5rem", 
              height: "56px", 
              fontSize: "1rem",
              fontWeight: 600,
              borderRadius: "14px", 
              background: "#10B981", // Verde sólido vibrante
              color: "white",
              border: "none",
              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)", // Glow suave
              transition: "transform 0.1s, box-shadow 0.2s",
              cursor: "pointer"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 6px 16px rgba(16, 185, 129, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.3)";
            }}
          >
            Iniciar sesión
          </Button>

          <div style={{ display: "flex", alignItems: "center", width: "100%", margin: "1rem 0" }}>
            <div style={{ flex: 1, height: "1px", backgroundColor: "#E5E7EB" }}></div>
            <span style={{ padding: "0 0.5rem", fontSize: "0.875rem", color: "#6B7280" }}>O continúa con</span>
            <div style={{ flex: 1, height: "1px", backgroundColor: "#E5E7EB" }}></div>
          </div>

          <Button 
            type="button" 
            variant="outline"
            onClick={() => googleLogin()}
            disabled={loading}
            style={{ 
              width: "100%", 
              height: "56px", 
              fontSize: "1rem",
              fontWeight: 600,
              borderRadius: "14px", 
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </Button>
        </form>

        {/* Footer */}
        <div style={{ marginTop: "2rem", fontSize: "0.9rem", color: "#6B7280" }}>
          ¿No tienes cuenta?{" "}
          <Link to="/register" style={{ color: "#10B981", fontWeight: 700, textDecoration: "none" }}>
            Regístrate gratis
          </Link>
        </div>

      </div>
    </div>
  );
}
