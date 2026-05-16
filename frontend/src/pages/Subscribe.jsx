import { useState, useEffect } from "react";
import { apiFetch } from "../lib/api";
import { getToken } from "../lib/auth";
import { useAuth } from "../context/AuthContext";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Check, Star, ShieldCheck, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Subscribe() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Verificar si ya tiene suscripción activa al cargar
  useEffect(() => {
    if (user?.subscriptionStatus === "active" || user?.subscriptionStatus === "trialing") {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/billing/create-checkout-session", {
        method: "POST",
        token: getToken(),
      });
      if (res.ok && res.url) {
        window.location.href = res.url;
      } else {
        alert("Error al iniciar suscripción");
      }
    } catch (error) {
      console.error(error);
      alert(error.message || "Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleManage = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/billing/create-portal-session", {
        method: "POST",
        token: getToken(),
      });
      if (res.ok && res.url) {
        window.location.href = res.url;
      } else {
        alert("Error al abrir portal");
      }
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ 
      minHeight: "100vh", 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      justifyContent: "center",
      padding: "1.5rem",
      backgroundColor: "var(--color-background)"
    }}>
      <div style={{ maxWidth: "400px", width: "100%", textAlign: "center" }}>
        <div style={{ 
          width: "64px", height: "64px", 
          borderRadius: "50%", 
          backgroundColor: "var(--color-surface)", 
          color: "var(--color-secondary)",
          border: "1px solid var(--color-border)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 1.5rem auto"
        }}>
          <Star size={32} fill="var(--color-secondary)" />
        </div>
        
        <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--color-text)", marginBottom: "0.5rem" }}>
          Premium
        </h1>
        <p style={{ color: "var(--color-text-secondary)", marginBottom: "2rem", fontSize: "1.1rem" }}>
          Desbloquea el control total de tus finanzas
        </p>

        <Card style={{ padding: "2rem", border: "2px solid var(--color-secondary)", position: "relative", overflow: "visible" }}>
          <div style={{ 
            position: "absolute", 
            top: "-12px", 
            left: "50%", 
            transform: "translateX(-50%)",
            backgroundColor: "var(--color-secondary)",
            color: "var(--color-text)",
            padding: "0.25rem 1rem",
            borderRadius: "99px",
            fontSize: "0.75rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Oferta Lanzamiento
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <span style={{ fontSize: "3rem", fontWeight: 800, color: "var(--color-text)" }}>1€</span>
            <span style={{ color: "var(--color-text-secondary)", fontSize: "1.1rem" }}> / mes</span>
          </div>

          <div style={{ 
            backgroundColor: "var(--color-surface-hover)", 
            border: "1px solid var(--color-border)",
            padding: "1rem", 
            borderRadius: "0.75rem", 
            marginBottom: "1.5rem",
            color: "var(--color-text)",
            fontWeight: 600,
            fontSize: "0.95rem"
          }}>
            Oferta de lanzamiento: 1€/mes
            <div style={{ fontSize: "0.8rem", fontWeight: 400, marginTop: "0.25rem", color: "var(--color-secondary)" }}>
              Pago seguro con Stripe. Cancela cuando quieras.
            </div>
          </div>

          <ul style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "2rem" }}>
            <li style={{ display: "flex", gap: "0.75rem", alignItems: "center", fontSize: "0.95rem" }}>
              <Check size={18} color="var(--color-success)" strokeWidth={3} />
              <span>Registro ilimitado de gastos</span>
            </li>
            <li style={{ display: "flex", gap: "0.75rem", alignItems: "center", fontSize: "0.95rem" }}>
              <Check size={18} color="var(--color-success)" strokeWidth={3} />
              <span>Gestión de deudas y préstamos</span>
            </li>
            <li style={{ display: "flex", gap: "0.75rem", alignItems: "center", fontSize: "0.95rem" }}>
              <Check size={18} color="var(--color-success)" strokeWidth={3} />
              <span>Reportes y gráficos avanzados</span>
            </li>
            <li style={{ display: "flex", gap: "0.75rem", alignItems: "center", fontSize: "0.95rem" }}>
              <Check size={18} color="var(--color-success)" strokeWidth={3} />
              <span>Acceso multidispositivo</span>
            </li>
          </ul>

          <Button 
            onClick={handleSubscribe} 
            disabled={loading}
            style={{ 
              width: "100%", 
              backgroundColor: "var(--color-secondary)", 
              padding: "1rem", 
              fontSize: "1.1rem",
              boxShadow: "0 4px 6px -1px rgba(59, 130, 246, 0.35)" 
            }}
          >
            {loading ? "Procesando..." : "Activar Ahora"}
          </Button>

          <p style={{ marginTop: "1rem", fontSize: "0.75rem", color: "var(--color-text-tertiary)" }}>
            Sin permanencia. Cancela cuando quieras.
          </p>
        </Card>

        <div style={{ marginTop: "2rem", display: "flex", gap: "1rem", justifyContent: "center", color: "var(--color-text-tertiary)", fontSize: "0.875rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <ShieldCheck size={16} /> Pago seguro
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <Zap size={16} /> Activación inmediata
          </div>
        </div>
        
        <div style={{ marginTop: "2rem" }}>
             <button 
               onClick={handleManage}
               style={{ background: "none", border: "none", color: "var(--color-text-secondary)", textDecoration: "underline", cursor: "pointer", fontSize: "0.875rem" }}
             >
               Ya tengo suscripción (Restaurar / Gestionar)
             </button>
        </div>
      </div>
    </div>
  );
}
