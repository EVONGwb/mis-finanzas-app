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
        padding: "1.5rem",
        position: "relative",
        overflow: "hidden"
      }}
    >
      {/* Decorative background elements */}
      <div style={{
        position: "absolute",
        top: -100,
        left: -100,
        width: "300px",
        height: "300px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, rgba(255,255,255,0) 70%)",
        zIndex: 0
      }} />
      <div style={{
        position: "absolute",
        bottom: -50,
        right: -50,
        width: "250px",
        height: "250px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, rgba(255,255,255,0) 70%)",
        zIndex: 0
      }} />

      <div style={{ 
        width: "100%", 
        maxWidth: "420px", 
        zIndex: 1, 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center",
        backgroundColor: "rgba(255, 255, 255, 0.85)", // Glass effect
        backdropFilter: "blur(12px)",
        borderRadius: "24px",
        padding: "2.5rem 2rem",
        boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.5)"
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
            placeholder="Nombre completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ height: "56px", fontSize: "1rem" }}
          />
          <Input
            icon={Mail}
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ height: "56px", fontSize: "1rem" }}
          />
          <Input
            icon={Lock}
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ height: "56px", fontSize: "1rem" }}
          />
          <Input
            icon={Lock}
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
