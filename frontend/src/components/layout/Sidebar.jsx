import { NavLink } from "react-router-dom";
import { LayoutDashboard, TrendingUp, TrendingDown, FileText, LogOut, X, Shield, Briefcase } from "lucide-react";

export function Sidebar({ isOpen, onClose, onLogout, user }) {
  const links = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/incomes", label: "Ingresos", icon: TrendingUp },
    { to: "/expenses", label: "Gastos", icon: TrendingDown },
    { to: "/deliveries", label: "Entregas", icon: Briefcase },
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
          width: "280px", // Increased width for better spacing
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "3rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ 
              width: "40px", height: "40px", 
              borderRadius: "12px", 
              background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "white", fontWeight: "bold",
              boxShadow: "var(--shadow-md)"
            }}>
              M
            </div>
            <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text)", letterSpacing: "-0.5px" }}>
              Mis Finanzas
            </span>
          </div>
          <button onClick={onClose} className="md-hidden" style={{ background: "none", border: "none", cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 }}>
          <p style={{ 
            fontSize: "0.75rem", 
            fontWeight: 600, 
            color: "var(--color-text-tertiary)", 
            textTransform: "uppercase", 
            letterSpacing: "0.05em",
            marginBottom: "0.5rem",
            paddingLeft: "1rem"
          }}>
            Menú Principal
          </p>
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
                padding: "0.875rem 1rem",
                borderRadius: "var(--radius-sm)",
                color: isActive ? "var(--color-primary)" : "var(--color-text-secondary)",
                backgroundColor: isActive ? "var(--color-success-bg)" : "transparent",
                fontWeight: isActive ? 600 : 500,
                textDecoration: "none",
                transition: "all 0.2s",
                position: "relative"
              })}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div style={{
                      position: "absolute",
                      left: 0,
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "4px",
                      height: "20px",
                      backgroundColor: "var(--color-primary)",
                      borderTopRightRadius: "4px",
                      borderBottomRightRadius: "4px"
                    }} />
                  )}
                  <link.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  {link.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "1.5rem", marginTop: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem", padding: "0 0.5rem" }}>
            <div style={{ 
              width: "40px", height: "40px", 
              borderRadius: "50%", 
              backgroundColor: "var(--color-secondary)",
              color: "white",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: "bold"
            }}>
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text)" }}>{user?.name || "Usuario"}</span>
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>{user?.email}</span>
            </div>
          </div>
          
          <button
            onClick={onLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              width: "100%",
              padding: "0.75rem 1rem",
              background: "none",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-secondary)",
              cursor: "pointer",
              borderRadius: "var(--radius-sm)",
              transition: "all 0.2s",
              justifyContent: "center",
              fontWeight: 500
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "var(--color-danger-bg)";
              e.currentTarget.style.borderColor = "var(--color-danger-bg)";
              e.currentTarget.style.color = "var(--color-danger)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.borderColor = "var(--color-border)";
              e.currentTarget.style.color = "var(--color-text-secondary)";
            }}
          >
            <LogOut size={18} />
            Cerrar Sesión
          </button>
        </div>
      </aside>
    </>
  );
}
