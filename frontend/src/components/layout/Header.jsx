import { Menu, Bell, ChevronDown } from "lucide-react";

export function Header({ onMenuClick, user }) {
  const currentMonth = new Date().toLocaleString('es-ES', { month: 'long', year: 'numeric' });

  return (
    <header style={{
      height: "80px",
      backgroundColor: "var(--color-surface)",
      borderBottom: "1px solid var(--color-border)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 1.5rem",
      position: "sticky",
      top: 0,
      zIndex: 30,
      boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {/* Logo and App Name (Mobile) */}
        <div style={{ 
          width: "32px", height: "32px", 
          borderRadius: "8px", 
          background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "white", fontWeight: "bold",
          fontSize: "1.2rem"
        }}>
          M
        </div>
        <div>
          <h1 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text)", lineHeight: 1.2 }}>Mis Finanzas</h1>
          {/* Simple Month Selector Mockup */}
          <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", display: "flex", alignItems: "center", gap: "2px" }}>
            <span style={{ textTransform: "capitalize" }}>{currentMonth}</span>
            <ChevronDown size={12} />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        {/* User Avatar */}
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "0.75rem", 
          cursor: "pointer"
        }}>
          <img 
            src={`https://ui-avatars.com/api/?name=${user?.name || "User"}&background=10B981&color=fff`} 
            alt="Profile" 
            style={{ 
              width: "36px", 
              height: "36px", 
              borderRadius: "50%", 
              objectFit: "cover",
              border: "2px solid white",
              boxShadow: "var(--shadow-sm)"
            }} 
          />
        </div>
      </div>
    </header>
  );
}
