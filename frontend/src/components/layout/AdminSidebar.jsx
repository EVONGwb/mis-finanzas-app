import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, FileText, LogOut, X, Shield, ArrowLeft } from "lucide-react";

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
          backgroundColor: "#1e293b", // Darker background for Admin
          color: "white",
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
              background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "white", fontWeight: "bold",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
            }}>
              <Shield size={24} />
            </div>
            <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "white", letterSpacing: "-0.5px" }}>
              Admin
            </span>
          </div>
          <button onClick={onClose} className="md-hidden" style={{ background: "none", border: "none", cursor: "pointer", color: "white" }}>
            <X size={20} />
          </button>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 }}>
          <p style={{ 
            fontSize: "0.75rem", 
            fontWeight: 600, 
            color: "#94a3b8", 
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
                color: isActive ? "white" : "#94a3b8",
                backgroundColor: isActive ? "#334155" : "transparent",
                fontWeight: isActive ? 600 : 500,
                textDecoration: "none",
                transition: "all 0.2s",
              })}
            >
              <link.icon size={20} />
              {link.label}
            </NavLink>
          ))}

          <div style={{ marginTop: "2rem", borderTop: "1px solid #334155", paddingTop: "1rem" }}>
            <NavLink
              to="/dashboard"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.875rem 1rem",
                borderRadius: "0.5rem",
                color: "#94a3b8",
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

        <div style={{ borderTop: "1px solid #334155", paddingTop: "1.5rem", marginTop: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem", padding: "0 0.5rem" }}>
            <div style={{ 
              width: "40px", height: "40px", 
              borderRadius: "50%", 
              backgroundColor: "#475569",
              color: "white",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: "bold"
            }}>
              {user?.name?.charAt(0).toUpperCase() || "A"}
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "white" }}>{user?.name || "Admin"}</span>
              <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{user?.email}</span>
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
              border: "1px solid #334155",
              color: "#94a3b8",
              cursor: "pointer",
              borderRadius: "0.5rem",
              transition: "all 0.2s",
              justifyContent: "center",
              fontWeight: 500
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "#ef4444";
              e.currentTarget.style.borderColor = "#ef4444";
              e.currentTarget.style.color = "white";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.borderColor = "#334155";
              e.currentTarget.style.color = "#94a3b8";
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
