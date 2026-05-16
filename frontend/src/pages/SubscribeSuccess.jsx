import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { CheckCircle } from "lucide-react";

export default function SubscribeSuccess() {
  const navigate = useNavigate();
  const { fetchUser } = useAuth();

  useEffect(() => {
    // Refrescar usuario para obtener el nuevo estado de suscripción
    const refresh = async () => {
      await fetchUser();
      setTimeout(() => navigate("/dashboard"), 3000);
    };
    refresh();
  }, [fetchUser, navigate]);

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
      <CheckCircle size={64} color="var(--color-success)" style={{ marginBottom: "1.5rem" }} />
      <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "var(--color-text)" }}>¡Pago Exitoso!</h1>
      <p style={{ color: "var(--color-text-secondary)", marginTop: "1rem" }}>Tu suscripción se ha activado correctamente.</p>
      <p style={{ color: "var(--color-text-tertiary)", marginTop: "0.5rem" }}>Redirigiendo a tu dashboard...</p>
    </div>
  );
}
