import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export function SubscriptionGuard({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <div className="animate-spin" style={{ 
          width: "32px", height: "32px", 
          border: "2px solid #e2e8f0", 
          borderTopColor: "#3b82f6", 
          borderRadius: "50%" 
        }} />
      </div>
    );
  }

  // 1. Si no hay usuario, redirigir a login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Si es admin, pase VIP (opcional, pero útil para devs/admins)
  if (user.role === "admin") {
    return children;
  }

  // 3. Verificar estado de suscripción
  const isActive = ["active", "trialing"].includes(user.subscriptionStatus);
  // Verificar fecha (dar margen de 24h por diferencias de zona horaria)
  const isPeriodValid = user.currentPeriodEnd 
    ? new Date(user.currentPeriodEnd) > new Date(Date.now() - 86400000)
    : false;

  if (isActive && isPeriodValid) {
    return children;
  }

  // 4. Si no tiene suscripción activa, redirigir a /subscribe
  return <Navigate to="/subscribe" replace />;
}
