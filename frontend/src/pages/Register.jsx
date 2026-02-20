import { useState } from "react";
import { apiFetch } from "../lib/api";
import { setToken } from "../lib/auth";
import { Link } from "react-router-dom";
import { TrendingUp } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";

export default function Register({ onAuthed }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
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
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--color-background)",
        padding: "1rem"
      }}
    >
      <div style={{ width: "100%", maxWidth: "420px" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              backgroundColor: "var(--color-primary)",
              borderRadius: "12px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              marginBottom: "1rem",
              boxShadow: "var(--shadow-md)"
            }}
          >
            <TrendingUp size={28} />
          </div>
          <h1 style={{ fontSize: "1.875rem", fontWeight: 700, color: "var(--color-primary)" }}>
            Mis Finanzas
          </h1>
          <p style={{ color: "var(--color-text-secondary)", marginTop: "0.5rem" }}>
            Crea tu cuenta en segundos
          </p>
        </div>

        <Card className="animate-fade-in" padding="2rem">
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <Input
              label="Nombre"
              placeholder="Tu nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Contraseña"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && (
              <div
                style={{
                  padding: "0.75rem",
                  backgroundColor: "var(--color-danger-bg)",
                  color: "var(--color-danger)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.875rem"
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
              style={{ width: "100%", marginTop: "0.5rem" }}
            >
              Crear cuenta
            </Button>
          </form>

          <div
            style={{
              marginTop: "1.5rem",
              textAlign: "center",
              fontSize: "0.875rem",
              color: "var(--color-text-secondary)"
            }}
          >
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" style={{ color: "var(--color-primary)", fontWeight: 600 }}>
              Iniciar sesión
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
