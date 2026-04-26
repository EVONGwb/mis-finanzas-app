import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, FileText, LogOut, X, ArrowLeft } from "lucide-react";

export function AdminSidebar({ isOpen, onClose, onLogout, user }) {
  const links = [
    { to: "/admin/dashboard", label: "Inicio", icon: LayoutDashboard },
    { to: "/admin/users", label: "Usuarios", icon: Users },
    { to: "/admin/audit", label: "Auditoría", icon: FileText },
  ];

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
          width: "280px",
          backgroundColor: "rgba(6, 15, 23, 0.92)",
          color: "var(--color-text)",
          zIndex: 50,
          transform: isOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.3s ease-in-out",
          display: "flex",
          flexDirection: "column",
          padding: "1.5rem",
          borderRight: "1px solid var(--color-glass-border)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "3rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <img
              src="/logo.png?v=2"
              alt="Mis Finanzas"
              style={{ width: 42, height: 42, objectFit: "contain" }}
            />
            <span style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--color-text)", letterSpacing: "-0.5px" }}>
              Admin
            </span>
          </div>
          <button onClick={onClose} className="md-hidden" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text)" }}>
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
            Gestión
          </p>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onClose}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.875rem 1rem",
                borderRadius: "0.5rem",
                color: isActive ? "var(--color-text)" : "var(--color-text-secondary)",
                backgroundColor: isActive ? "var(--color-surface-strong)" : "transparent",
                border: isActive ? "1px solid var(--color-glass-border)" : "1px solid transparent",
                fontWeight: isActive ? 600 : 500,
                textDecoration: "none",
                transition: "all 0.2s",
              })}
            >
              <link.icon size={20} />
              {link.label}
            </NavLink>
          ))}

          <div style={{ marginTop: "2rem", borderTop: "1px solid var(--color-glass-border)", paddingTop: "1rem" }}>
            <NavLink
              to="/dashboard"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.875rem 1rem",
                borderRadius: "0.5rem",
                color: "var(--color-text-secondary)",
                fontWeight: 500,
                textDecoration: "none",
                transition: "all 0.2s",
              }}
            >
              <ArrowLeft size={20} />
              Volver a la App
            </NavLink>
          </div>
        </nav>

        <div style={{ borderTop: "1px solid var(--color-glass-border)", paddingTop: "1.5rem", marginTop: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem", padding: "0 0.5rem" }}>
            <div style={{ 
              width: "40px", height: "40px", 
              borderRadius: "50%", 
              backgroundColor: "var(--color-surface-strong)",
              color: "var(--color-text)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: "bold"
            }}>
              {user?.name?.charAt(0).toUpperCase() || "A"}
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--color-text)" }}>{user?.name || "Admin"}</span>
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)" }}>{user?.email}</span>
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
              borderRadius: "0.5rem",
              transition: "all 0.2s",
              justifyContent: "center",
              fontWeight: 500
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "var(--color-danger)";
              e.currentTarget.style.borderColor = "var(--color-danger)";
              e.currentTarget.style.color = "rgba(255, 255, 255, 0.98)";
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
