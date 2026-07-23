import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  CreditCard, 
  Home, 
  Building2, 
  Target, 
  FileText, 
  Settings, 
  ChevronDown,
  HandCoins
} from "lucide-react";
import { Skeleton } from "../components/ui/Skeleton";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [homeBadge, setHomeBadge] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
           const resUser = await apiFetch("/auth/me");
           if (resUser.data) {
             setUser(resUser.data);
             localStorage.setItem("user", JSON.stringify(resUser.data));
           }
        }

        // Fetch pending shopping items count for badge
        const resHome = await apiFetch("/home");
        if (resHome.data?.home?.shoppingList) {
          const pendingCount = resHome.data.home.shoppingList.filter(i => !i.isBought).length;
          setHomeBadge(pendingCount);
        }

      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const menuItems = [
    { title: "Banco", icon: Wallet, bg: "linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)", glowWeak: "rgba(147, 197, 253, 0.52)", glowStrong: "rgba(59, 130, 246, 0.98)", link: "/bank", desc: "Saldo y movimientos", fullWidth: true },
    { title: "H & C", icon: Building2, bg: "linear-gradient(135deg, #059669 0%, #10B981 100%)", glowWeak: "rgba(110, 231, 183, 0.48)", glowStrong: "rgba(16, 185, 129, 0.98)", link: "/deliveries", desc: "Horas y cobros" },
    { title: "Gastos", icon: TrendingDown, bg: "linear-gradient(135deg, #DC2626 0%, #EF4444 100%)", glowWeak: "rgba(252, 165, 165, 0.52)", glowStrong: "rgba(239, 68, 68, 0.98)", link: "/expenses", desc: "Controla tus gastos" },
    { title: "Me Deben", icon: HandCoins, bg: "linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)", glowWeak: "rgba(147, 197, 253, 0.48)", glowStrong: "rgba(37, 99, 235, 0.98)", link: "/credits", desc: "Cuentas y cobros" }, 
    { title: "Deudas", icon: CreditCard, bg: "linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%)", glowWeak: "rgba(196, 181, 253, 0.52)", glowStrong: "rgba(139, 92, 246, 0.98)", link: "/debts", desc: "Control de deudas" },
    { title: "Hogar", icon: Home, bg: "linear-gradient(135deg, #D97706 0%, #F59E0B 100%)", glowWeak: "rgba(253, 186, 116, 0.52)", glowStrong: "rgba(245, 158, 11, 0.98)", link: "/home", desc: "Compras en pareja", badge: homeBadge > 0 ? homeBadge : null },
    { title: "Objetivos", icon: Target, bg: "linear-gradient(135deg, #059669 0%, #34D399 100%)", glowWeak: "rgba(167, 243, 208, 0.52)", glowStrong: "rgba(52, 211, 153, 0.98)", link: "/goals", desc: "Metas de ahorro" },
    { title: "Reportes", icon: FileText, bg: "linear-gradient(135deg, #475569 0%, #64748B 100%)", glowWeak: "rgba(203, 213, 225, 0.42)", glowStrong: "rgba(148, 163, 184, 0.92)", link: "/reports", desc: "Estadísticas" },
    { title: "Ajustes", icon: Settings, bg: "linear-gradient(135deg, #1F2937 0%, #374151 100%)", glowWeak: "rgba(148, 163, 184, 0.36)", glowStrong: "rgba(203, 213, 225, 0.82)", link: "/profile", desc: "Configuración", fullWidth: true },
  ];

  return (
    <div className="animate-fade-in dashboard-home">
      
      {/* HEADER */}
      <div className="dashboard-home-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", width: "100%", justifyContent: "space-between" }}>
           <h1 className="dashboard-home-title">
             Hola, {user?.name?.split(' ')[0] || "Prudencio"} 👋
           </h1>
           
           {/* Month Selector Compact */}
           <div className="dashboard-month-pill">
             <span style={{ textTransform: "capitalize" }}>{new Date().toLocaleString('es-ES', { month: 'long' })}</span>
             <ChevronDown size={14} />
           </div>
        </div>
      </div>
      
      {/* GRID MENU */}
      <div className="dashboard-menu-grid">
        {loading ? (
          Array(6).fill(0).map((_, i) => <Skeleton key={i} height="var(--dashboard-card-height)" borderRadius="18px" />)
        ) : (
          menuItems.map((item, index) => (
            <Link 
              key={index} 
              to={item.link}
              style={{
                textDecoration: "none",
                color: "var(--color-on-accent)",
                position: "relative",
                overflow: "hidden",
                gridColumn: item.fullWidth ? "span 2" : "span 1"
              }}
            >
              <div className="dashboard-menu-card" style={{
                background: item.bg,
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                transition: "transform 0.1s ease-in-out",
                cursor: "pointer",
                position: "relative",
                "--card-glow-weak": item.glowWeak,
                "--card-glow-strong": item.glowStrong
              }}
              onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.97)"}
              onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
              >
                {/* Glow Effect Bottom */}
                <div className="dashboard-card-glow"></div>

                {/* Badge if exists */}
                {item.badge && (
                  <div style={{
                    position: "absolute",
                    top: "-5px",
                    right: "-5px",
                    backgroundColor: "var(--color-danger)",
                    color: "var(--color-on-accent)",
                    borderRadius: "50%",
                    width: "24px",
                    height: "24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.75rem",
                    fontWeight: "bold",
                    border: "2px solid var(--color-on-accent)",
                    zIndex: 10
                  }}>
                    {item.badge}
                  </div>
                )}

                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center",
                  marginBottom: "0.25rem"
                }}>
                   {/* Icon Wrapper */}
                   <div className="dashboard-card-heading">
                      <item.icon className="dashboard-card-icon" strokeWidth={2.5} color="var(--color-on-accent)" />
                      <h3 className="dashboard-card-title">
                        {item.title}
                      </h3>
                   </div>
                </div>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                  <p className="dashboard-card-desc">
                    {item.desc}
                  </p>
                  <div style={{ opacity: 0.8 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

    </div>
  );
}
