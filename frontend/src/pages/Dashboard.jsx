import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { getToken } from "../lib/auth";
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
  Landmark
} from "lucide-react";
import { Skeleton } from "../components/ui/Skeleton";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const token = getToken();
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
           const resUser = await apiFetch("/auth/me", { token });
           if (resUser.data) {
             setUser(resUser.data);
             localStorage.setItem("user", JSON.stringify(resUser.data));
           }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const menuItems = [
    { title: "INGRESOS", icon: TrendingUp, color: "#10B981", bg: "linear-gradient(135deg, #10B981 0%, #059669 100%)", link: "/incomes", desc: "Entradas" },
    { title: "GASTOS", icon: TrendingDown, color: "#EF4444", bg: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)", link: "/expenses", desc: "Salidas" },
    { title: "BENEFICIO", icon: Wallet, color: "#0EA5E9", bg: "linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)", link: "/closing", desc: "Balance" },
    { title: "BANCO", icon: Landmark, color: "#1E3A8A", bg: "linear-gradient(135deg, #3B82F6 0%, #1E3A8A 100%)", link: "/credits", desc: "Activos" }, // Linking to credits as placeholder for "Me Deben"/Assets
    { title: "DEUDAS", icon: CreditCard, color: "#8B5CF6", bg: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)", link: "/debts", desc: "Pasivos" },
    { title: "HOGAR", icon: Home, color: "#F59E0B", bg: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)", link: "/home", desc: "Compartido" },
    { title: "EMPRESAS", icon: Building2, color: "#374151", bg: "linear-gradient(135deg, #4B5563 0%, #1F2937 100%)", link: "/deliveries", desc: "Horas" },
    { title: "OBJETIVOS", icon: Target, color: "#84CC16", bg: "linear-gradient(135deg, #84CC16 0%, #65A30D 100%)", link: "#", desc: "Metas" },
    { title: "REPORTES", icon: FileText, color: "#64748B", bg: "linear-gradient(135deg, #94A3B8 0%, #64748B 100%)", link: "/closing", desc: "Informes" },
    { title: "AJUSTES", icon: Settings, color: "#9CA3AF", bg: "linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%)", link: "/profile", desc: "Config" },
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
        gap: "1rem",
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
                overflow: "hidden"
              }}
            >
              <div style={{
                background: item.bg,
                borderRadius: "24px",
                padding: "1.5rem",
                height: "140px", // Fixed height for consistency
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                transition: "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                cursor: "pointer",
              }}
              onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.97)"}
              onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
              >
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "flex-start" 
                }}>
                  <div style={{
                    backgroundColor: "rgba(255,255,255,0.2)",
                    borderRadius: "12px",
                    padding: "10px",
                    backdropFilter: "blur(4px)"
                  }}>
                    <item.icon size={28} strokeWidth={2} color="white" />
                  </div>
                </div>
                
                <div>
                  <h3 style={{ 
                    fontSize: "1rem", 
                    fontWeight: 800, 
                    marginBottom: "2px",
                    letterSpacing: "0.5px"
                  }}>
                    {item.title}
                  </h3>
                  <p style={{ 
                    fontSize: "0.75rem", 
                    opacity: 0.9, 
                    fontWeight: 500 
                  }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

    </div>
  );
}
