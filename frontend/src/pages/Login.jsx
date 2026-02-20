import { useState } from "react";
import { apiFetch } from "../lib/api";
import { setToken } from "../lib/auth";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card } from "../components/ui/Card";
import { TrendingUp } from "lucide-react";

export default function Login({ onAuthed }) {
  const [email, setEmail] = useState("user1@evongo.com");
  const [password, setPassword] = useState("123456");
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
      backgroundColor: "var(--color-background)",
      padding: "1rem"
    }}>
      <div style={{ width: "100%", maxWidth: "400px" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ 
            width: "48px", height: "48px", 
            backgroundColor: "var(--color-primary)", 
            borderRadius: "12px", 
            display: "inline-flex", 
            alignItems: "center", 
            justifyContent: "center",
            color: "white",
            marginBottom: "1rem",
            boxShadow: "var(--shadow-md)"
          }}>
            <TrendingUp size={28} />
          </div>
          <h1 style={{ fontSize: "1.875rem", fontWeight: 700, color: "var(--color-primary)" }}>Mis Finanzas</h1>
          <p style={{ color: "var(--color-text-secondary)", marginTop: "0.5rem" }}>
            Gestiona tus ingresos y gastos de forma inteligente
          </p>
        </div>

        <Card className="animate-fade-in" padding="2rem">
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <Input 
              label="Email" 
              type="email" 
              placeholder="tu@email.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
            />
            
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <Input 
                label="Contraseña" 
                type="password" 
                placeholder="••••••" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
              />
              <div style={{ textAlign: "right" }}>
                <a href="#" style={{ fontSize: "0.75rem", color: "var(--color-primary)", fontWeight: 500 }}>
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
            </div>

            {error && (
              <div style={{ 
                padding: "0.75rem", 
                backgroundColor: "var(--color-danger-bg)", 
                color: "var(--color-danger)", 
                borderRadius: "var(--radius-sm)",
                fontSize: "0.875rem"
              }}>
                {error}
              </div>
            )}

            <Button type="button" variant="primary" size="lg" isLoading={loading} onClick={submit} style={{ width: "100%", marginTop: "0.5rem" }}>
              Entrar
            </Button>
          </form>

          <div style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
            ¿No tienes cuenta? <a href="#" style={{ color: "var(--color-primary)", fontWeight: 600 }}>Crear cuenta</a>
          </div>
        </Card>
      </div>
    </div>
  );
}
