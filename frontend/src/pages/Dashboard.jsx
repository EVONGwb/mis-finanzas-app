import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { useCurrency } from "../context/CurrencyContext";
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
    { title: "Ingresos", icon: Building2, bg: "linear-gradient(135deg, #059669 0%, #10B981 100%)", link: "/deliveries", desc: "Nóminas y trabajos" },
    { title: "Gastos", icon: TrendingDown, bg: "linear-gradient(135deg, #DC2626 0%, #EF4444 100%)", link: "/expenses", desc: "Controla tus gastos" },
    { title: "Banco", icon: Wallet, bg: "linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)", link: "/bank", desc: "Saldo y movimientos" },
    { title: "Me Deben", icon: HandCoins, bg: "linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)", link: "/credits", desc: "Cuentas y cobros" }, 
    { title: "Deudas", icon: CreditCard, bg: "linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%)", link: "/debts", desc: "Control de deudas" },
    { title: "Hogar", icon: Home, bg: "linear-gradient(135deg, #D97706 0%, #F59E0B 100%)", link: "/home", desc: "Compras en pareja", badge: homeBadge > 0 ? homeBadge : null },
    { title: "Objetivos", icon: Target, bg: "linear-gradient(135deg, #059669 0%, #34D399 100%)", link: "/goals", desc: "Metas de ahorro" },
    { title: "Reportes", icon: FileText, bg: "linear-gradient(135deg, #475569 0%, #64748B 100%)", link: "/reports", desc: "Estadísticas" },
    { title: "Ajustes", icon: Settings, bg: "linear-gradient(135deg, #1F2937 0%, #374151 100%)", link: "/profile", desc: "Configuración" },
  ];

  return (
    <div className="animate-fade-in" style={{ paddingBottom: "6rem" }}>
      
      {/* HEADER */}
      <div style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", width: "100%", justifyContent: "space-between" }}>
           <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text)", letterSpacing: "-0.5px" }}>
             Hola, {user?.name?.split(' ')[0] || "Prudencio"} 👋
           </h1>
           
           {/* Month Selector Compact */}
           <div style={{ 
             display: "flex", 
             alignItems: "center", 
             gap: "0.25rem", 
             backgroundColor: "var(--color-surface)", 
             padding: "0.5rem 0.75rem", 
             borderRadius: "99px", 
             border: "1px solid var(--color-border)",
             color: "var(--color-text-secondary)",
             fontWeight: 600,
             fontSize: "0.8rem",
             boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
           }}>
             <span style={{ textTransform: "capitalize" }}>{new Date().toLocaleString('es-ES', { month: 'long' })}</span>
             <ChevronDown size={14} />
           </div>
        </div>
      </div>
      
      {/* GRID MENU */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "1fr 1fr", 
        gap: "0.75rem", // Slightly tighter gap
        paddingBottom: "1rem"
      }}>
        {loading ? (
          Array(6).fill(0).map((_, i) => <Skeleton key={i} height="120px" borderRadius="24px" />)
        ) : (
          menuItems.map((item, index) => (
            <Link 
              key={index} 
              to={item.link}
              style={{
                textDecoration: "none",
                color: "white",
                position: "relative",
                overflow: "hidden",
                gridColumn: (index === menuItems.length - 1 && menuItems.length % 2 !== 0) ? "span 2" : "span 1"
              }}
            >
              <div style={{
                background: item.bg,
                borderRadius: "20px", // Rounded corners
                padding: "1rem 1rem 1rem 1rem", // Padding adjusted
                height: "90px", // Shorter height like the design
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                transition: "transform 0.1s ease-in-out",
                cursor: "pointer",
                position: "relative"
              }}
              onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.97)"}
              onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
              >
                {/* Glow Effect Bottom */}
                <div style={{
                  position: "absolute",
                  bottom: "10px",
                  left: "20%",
                  right: "20%",
                  height: "2px",
                  background: "rgba(255,255,255,0.5)",
                  borderRadius: "2px",
                  boxShadow: "0 0 8px 1px rgba(255,255,255,0.6)"
                }}></div>

                {/* Badge if exists */}
                {item.badge && (
                  <div style={{
                    position: "absolute",
                    top: "-5px",
                    right: "-5px",
                    backgroundColor: "#EF4444",
                    color: "white",
                    borderRadius: "50%",
                    width: "24px",
                    height: "24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.75rem",
                    fontWeight: "bold",
                    border: "2px solid white",
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
                   <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <item.icon size={24} strokeWidth={2.5} color="white" />
                      <h3 style={{ 
                        fontSize: "0.95rem", 
                        fontWeight: 800, 
                        letterSpacing: "0.3px",
                        lineHeight: 1.1
                      }}>
                        {item.title}
                      </h3>
                   </div>
                </div>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                  <p style={{ 
                    fontSize: "0.65rem", 
                    opacity: 0.9, 
                    fontWeight: 500,
                    lineHeight: 1.2,
                    maxWidth: "85%"
                  }}>
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
