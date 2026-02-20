import { Menu, Bell, User } from "lucide-react";

export function Header({ onMenuClick, user }) {
  return (
    <header style={{
      height: "64px",
      backgroundColor: "var(--color-surface)",
      borderBottom: "1px solid var(--color-border)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 1.5rem",
      position: "sticky",
      top: 0,
      zIndex: 30
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <button 
          onClick={onMenuClick}
          className="md-hidden"
          style={{ background: "none", border: "none", cursor: "pointer", padding: "0.5rem" }}
        >
          <Menu size={24} color="var(--color-text-secondary)" />
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <button style={{ background: "none", border: "none", cursor: "pointer", position: "relative" }}>
          <Bell size={20} color="var(--color-text-secondary)" />
          <span style={{ 
            position: "absolute", top: -2, right: -2, 
            width: 8, height: 8, 
            backgroundColor: "var(--color-danger)", 
            borderRadius: "50%" 
          }} />
        </button>
        
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ textAlign: "right" }} className="md-block hidden">
            <div style={{ fontSize: "0.875rem", fontWeight: 600 }}>{user?.name || "Admin"}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>{user?.email || "admin@misfinanzas.com"}</div>
          </div>
          <div style={{ 
            width: "36px", height: "36px", 
            borderRadius: "50%", 
            backgroundColor: "var(--color-secondary)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--color-primary)"
          }}>
            <User size={20} />
          </div>
        </div>
      </div>
    </header>
  );
}
