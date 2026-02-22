import { useState } from "react";
import { apiFetch } from "../lib/api";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Mail, Lock, Eye, EyeOff, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

export default function Login({ onAuthed }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      flexDirection: "column",
      alignItems: "center", 
      justifyContent: "center", 
      backgroundColor: "var(--color-background)",
      padding: "1.5rem",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Decorative background elements */}
      <div style={{
        position: "absolute",
        top: -100,
        right: -100,
        width: "300px",
        height: "300px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, rgba(255,255,255,0) 70%)",
        zIndex: 0
      }} />
      <div style={{
        position: "absolute",
        bottom: -50,
        left: -50,
        width: "250px",
        height: "250px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, rgba(255,255,255,0) 70%)",
        zIndex: 0
      }} />

      <div style={{ width: "100%", maxWidth: "400px", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
        
        {/* Logo Section */}
        <div style={{ marginBottom: "2.5rem", textAlign: "center" }}>
          <div style={{ 
            width: "64px", height: "64px", 
            borderRadius: "16px", 
            background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)",
            display: "inline-flex", 
            alignItems: "center", 
            justifyContent: "center",
            color: "white",
            marginBottom: "1rem",
            boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.4)"
          }}>
            <TrendingUp size={32} strokeWidth={2.5} />
          </div>
          <h1 style={{ 
            fontSize: "2rem", 
            fontWeight: 800, 
            color: "var(--color-text)",
            letterSpacing: "-0.03em",
            marginBottom: "0.5rem"
          }}>
            Mis Finanzas
          </h1>
          <p style={{ 
            color: "var(--color-text-secondary)", 
            fontSize: "1rem",
            maxWidth: "280px",
            margin: "0 auto",
            lineHeight: 1.5
          }}>
            Controla tu economía al milímetro
          </p>
        </div>

        {/* Form Section */}
        <form onSubmit={submit} style={{ width: "100%", display: "flex", flexDirection: "column", gap: "1rem" }}>
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
            type={showPassword ? "text" : "password"} 
            placeholder="Contraseña" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
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

          <div style={{ textAlign: "right", marginTop: "-0.25rem" }}>
            <button
              type="button"
              style={{
                fontSize: "0.875rem",
                color: "var(--color-text-secondary)",
                fontWeight: 500,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "0.25rem 0"
              }}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          {error && (
            <div style={{ 
              padding: "0.875rem", 
              backgroundColor: "#FEF2F2", 
              color: "#EF4444", 
              borderRadius: "12px",
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
            variant="primary" 
            size="lg" 
            isLoading={loading} 
            style={{ 
              width: "100%", 
              marginTop: "1rem", 
              height: "56px", 
              fontSize: "1.125rem",
              borderRadius: "16px", // Matching input radius roughly or slightly more rounded
              background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)"
            }}
          >
            Iniciar sesión
          </Button>
        </form>

        {/* Footer */}
        <div style={{ marginTop: "2rem", display: "flex", gap: "0.5rem", fontSize: "0.95rem" }}>
          <span style={{ color: "var(--color-text-secondary)" }}>¿No tienes cuenta?</span>
          <Link to="/register" style={{ color: "var(--color-primary)", fontWeight: 700 }}>
            Crear cuenta
          </Link>
        </div>

        {/* Pagination Dots (Visual only as per image) */}
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "3rem" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--color-primary)", opacity: 0.3 }}></div>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--color-primary)" }}></div>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--color-primary)", opacity: 0.3 }}></div>
        </div>

      </div>
    </div>
  );
}
