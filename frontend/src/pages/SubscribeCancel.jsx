import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { XCircle } from "lucide-react";

export default function SubscribeCancel() {
  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => navigate("/subscribe"), 3000);
  }, [navigate]);

  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      justifyContent: "center", 
      height: "100vh", 
      textAlign: "center", 
      padding: "2rem",
      backgroundColor: "var(--color-background)",
      color: "var(--color-text)"
    }}>
      <XCircle size={64} color="var(--color-danger)" style={{ marginBottom: "1.5rem" }} />
      <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "var(--color-text)" }}>Pago Cancelado</h1>
      <p style={{ color: "var(--color-text-secondary)", marginTop: "1rem" }}>No se ha realizado ningún cargo.</p>
      <p style={{ color: "var(--color-text-tertiary)", marginTop: "0.5rem" }}>Volviendo a la página de suscripción...</p>
    </div>
  );
}
