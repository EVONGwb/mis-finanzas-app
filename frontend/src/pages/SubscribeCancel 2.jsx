import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { XCircle } from "lucide-react";

export default function SubscribeCancel() {
  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => navigate("/subscribe"), 3000);
  }, [navigate]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", textAlign: "center", padding: "2rem" }}>
      <XCircle size={64} color="#ef4444" style={{ marginBottom: "1.5rem" }} />
      <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "#1e293b" }}>Pago Cancelado</h1>
      <p style={{ color: "#64748b", marginTop: "1rem" }}>No se ha realizado ningún cargo.</p>
      <p style={{ color: "#94a3b8", marginTop: "0.5rem" }}>Volviendo a la página de suscripción...</p>
    </div>
  );
}
