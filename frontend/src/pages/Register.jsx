import { useState } from "react";
import { apiFetch } from "../lib/api";
import { setToken } from "../lib/auth";
import { Link } from "react-router-dom";
import { TrendingUp, User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";

export default function Register({ onAuthed }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (!acceptTerms) {
      setError("Debes aceptar los términos y condiciones");
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch("/auth/register", {
        method: "POST",
        body: { email, password, name }
      });
      setToken(res.data.token);
      onAuthed();
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
        maxWidth: "480px", 
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
            Crear cuenta
          </h1>
          <p style={{ 
            color: "#6B7280", 
            fontSize: "0.95rem",
            lineHeight: 1.5
          }}>
            Empieza a controlar tus finanzas hoy
          </p>
        </div>

        {/* Form Section */}
        <form onSubmit={submit} style={{ width: "100%", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label style={{ fontSize: "0.875rem", fontWeight: 600, color: "#374151", marginLeft: "0.25rem" }}>
              Nombre completo
            </label>
            <Input 
              icon={User}
              iconColor="#9CA3AF"
              placeholder="Ej. Juan Pérez" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required
              style={{ 
                height: "52px", 
                fontSize: "1rem", 
                borderRadius: "12px",
                backgroundColor: "#F9FAFB", 
                border: "1px solid #E5E7EB",
                boxShadow: "none"
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label style={{ fontSize: "0.875rem", fontWeight: 600, color: "#374151", marginLeft: "0.25rem" }}>
              Correo electrónico
            </label>
            <Input 
              icon={Mail}
              iconColor="#9CA3AF"
              type="email" 
              placeholder="ejemplo@correo.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required
              style={{ 
                height: "52px", 
                fontSize: "1rem", 
                borderRadius: "12px",
                backgroundColor: "#F9FAFB", 
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
                height: "52px", 
                fontSize: "1rem", 
                borderRadius: "12px",
                backgroundColor: "#F9FAFB",
                border: "1px solid #E5E7EB",
                boxShadow: "none"
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label style={{ fontSize: "0.875rem", fontWeight: 600, color: "#374151", marginLeft: "0.25rem" }}>
              Confirmar contraseña
            </label>
            <Input 
              icon={Lock}
              iconColor="#9CA3AF"
              type={showPassword ? "text" : "password"} 
              placeholder="••••••••" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              required
              style={{ 
                height: "52px", 
                fontSize: "1rem", 
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
          </div>

          {/* Checkbox */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0 0.25rem" }}>
            <input 
              type="checkbox" 
              id="terms" 
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              style={{ 
                width: "18px", 
                height: "18px", 
                accentColor: "#10B981",
                cursor: "pointer",
                borderRadius: "4px"
              }} 
            />
            <label htmlFor="terms" style={{ fontSize: "0.875rem", color: "#6B7280", cursor: "pointer" }}>
              Acepto los <span style={{ fontWeight: 600, color: "#111827" }}>términos y condiciones</span>
            </label>
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
              background: "#10B981", 
              color: "white",
              border: "none",
              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
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
            Crear cuenta
          </Button>
        </form>

        {/* Footer */}
        <div style={{ marginTop: "2rem", fontSize: "0.9rem", color: "#6B7280" }}>
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" style={{ color: "#10B981", fontWeight: 700, textDecoration: "none" }}>
            Inicia sesión
          </Link>
        </div>

      </div>
    </div>
  );
}
