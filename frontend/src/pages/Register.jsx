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
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--color-background)",
      padding: "1rem",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Decorative background elements (Waves) */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "300px",
        background: "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1440 320\"><path fill=\"%2310B981\" fill-opacity=\"0.1\" d=\"M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z\"></path></svg>') no-repeat top center",
        backgroundSize: "cover",
        zIndex: 0
      }} />
      <div style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        width: "100%",
        height: "300px",
        background: "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1440 320\"><path fill=\"%2310B981\" fill-opacity=\"0.1\" d=\"M0,64L48,80C96,96,192,128,288,128C384,128,480,96,576,90.7C672,85,768,107,864,128C960,149,1056,171,1152,165.3C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z\"></path></svg>') no-repeat bottom center",
        backgroundSize: "cover",
        zIndex: 0
      }} />

      <div style={{ 
        width: "100%", 
        maxWidth: "100%", 
        zIndex: 1, 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center",
        backgroundColor: "rgba(255, 255, 255, 0.9)", 
        borderRadius: "24px",
        padding: "1.5rem",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)"
      }}>
        
        {/* Header Section */}
        <div style={{ marginBottom: "2rem", textAlign: "center" }}>
          <div
            style={{
              width: "64px", height: "64px", 
              borderRadius: "16px", 
              background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)",
              display: "inline-flex", 
              alignItems: "center", 
              justifyContent: "center",
              color: "white",
              marginBottom: "1rem",
              boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.4)"
            }}
          >
            <TrendingUp size={32} strokeWidth={2.5} />
          </div>
          <h1 style={{ 
            fontSize: "2rem", 
            fontWeight: 800, 
            color: "var(--color-text)",
            letterSpacing: "-0.03em",
            marginBottom: "0.5rem"
          }}>
            Crear cuenta
          </h1>
          <p style={{ 
            color: "var(--color-text-secondary)", 
            fontSize: "1rem",
            maxWidth: "280px",
            margin: "0 auto",
            lineHeight: 1.5
          }}>
            Empieza a controlar tus finanzas hoy
          </p>
        </div>

        {/* Form Section */}
        <form onSubmit={submit} style={{ width: "100%", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <Input
            icon={User}
            iconColor="#10B981"
            placeholder="Nombre completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ height: "56px", fontSize: "1rem" }}
          />
          <Input
            icon={Mail}
            iconColor="#10B981"
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ height: "56px", fontSize: "1rem" }}
          />
          <Input
            icon={Lock}
            iconColor="#10B981"
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ height: "56px", fontSize: "1rem" }}
          />
          <Input
            icon={Lock}
            iconColor="#10B981"
            type={showPassword ? "text" : "password"}
            placeholder="Confirmar contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            style={{ height: "56px", fontSize: "1rem" }}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-text-tertiary)",
                  display: "flex",
                  alignItems: "center",
                  padding: "0.25rem"
                }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            }
          />

          {/* Checkbox */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0 0.25rem" }}>
            <input 
              type="checkbox" 
              id="terms" 
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              style={{ 
                width: "20px", 
                height: "20px", 
                accentColor: "var(--color-primary)",
                cursor: "pointer"
              }} 
            />
            <label htmlFor="terms" style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)", cursor: "pointer" }}>
              Acepto los <span style={{ fontWeight: 600, color: "var(--color-text)" }}>términos y condiciones</span>
            </label>
          </div>

          {error && (
            <div
              style={{
                padding: "0.875rem",
                backgroundColor: "#FEF2F2",
                color: "#EF4444",
                borderRadius: "12px",
                fontSize: "0.875rem",
                textAlign: "center",
                fontWeight: 500,
                border: "1px solid #FEE2E2"
              }}
            >
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={loading}
            style={{ 
              width: "100%", 
              marginTop: "0.5rem", 
              height: "56px", 
              fontSize: "1.125rem",
              borderRadius: "16px",
              background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)"
            }}
          >
            Crear cuenta
          </Button>
        </form>

        {/* Footer */}
        <div
          style={{
            marginTop: "2rem",
            textAlign: "center",
            fontSize: "0.95rem",
            color: "var(--color-text-secondary)"
          }}
        >
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" style={{ color: "var(--color-primary)", fontWeight: 700 }}>
            Inicia sesión
          </Link>
        </div>

        {/* Pagination Dots */}
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "3rem" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--color-primary)", opacity: 0.3 }}></div>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--color-primary)", opacity: 0.3 }}></div>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--color-primary)" }}></div>
        </div>

      </div>
    </div>
  );
}
