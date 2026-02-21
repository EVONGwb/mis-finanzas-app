import { NavLink } from "react-router-dom";
import { LayoutDashboard, TrendingUp, TrendingDown, FileText, LogOut, X, Shield } from "lucide-react";

export function Sidebar({ isOpen, onClose, onLogout, user }) {
  const links = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/incomes", label: "Ingresos", icon: TrendingUp },
    { to: "/expenses", label: "Gastos", icon: TrendingDown },
    { to: "/closing", label: "Cierre Mensual", icon: FileText },
  ];

  if (user?.role === "admin") {
    links.push({ to: "/admin/users", label: "Panel Admin", icon: Shield });
  }

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          zIndex: 40,
          display: isOpen ? "block" : "none",
        }}
        onClick={onClose}
        className="md-hidden"
      />

      <aside 
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: "260px",
          backgroundColor: "var(--color-surface)",
          borderRight: "1px solid var(--color-border)",
          zIndex: 50,
          transform: isOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.3s ease-in-out",
          display: "flex",
          flexDirection: "column",
          padding: "1.5rem"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ 
              width: "32px", height: "32px", 
              borderRadius: "8px", 
              backgroundColor: "var(--color-primary)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "white", fontWeight: "bold"
            }}>
              M
            </div>
            <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-primary)" }}>
              Mis Finanzas
            </span>
          </div>
          <button onClick={onClose} className="md-hidden" style={{ background: "none", border: "none", cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 }}>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => {
                if (window.innerWidth < 768) onClose();
              }}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.75rem 1rem",
                borderRadius: "var(--radius-sm)",
                color: isActive ? "var(--color-primary)" : "var(--color-text-secondary)",
                backgroundColor: isActive ? "var(--color-secondary)" : "transparent",
                fontWeight: isActive ? 600 : 500,
                textDecoration: "none",
                transition: "all 0.2s"
              })}
            >
              <link.icon size={20} />
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "1rem", marginTop: "auto" }}>
          <button
            onClick={onLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              width: "100%",
              padding: "0.75rem 1rem",
              background: "none",
              border: "none",
              color: "var(--color-text-secondary)",
              cursor: "pointer",
              borderRadius: "var(--radius-sm)",
              transition: "background 0.2s"
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = "var(--color-danger-bg)"}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}
          >
            <LogOut size={20} />
            Cerrar Sesión
          </button>
        </div>
      </aside>
    </>
  );
}
