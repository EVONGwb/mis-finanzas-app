import { Menu, Bell, ChevronDown } from "lucide-react";

export function Header({ onMenuClick, user }) {
  return (
    <header style={{
      height: "80px",
      backgroundColor: "var(--color-surface)",
      borderBottom: "1px solid var(--color-border)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 2rem",
      position: "sticky",
      top: 0,
      zIndex: 30,
      boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <button 
          onClick={onMenuClick}
          className="md-hidden"
          style={{ background: "none", border: "none", cursor: "pointer", padding: "0.5rem" }}
        >
          <Menu size={24} color="var(--color-text)" />
        </button>
        
        {/* Breadcrumb or Page Title placeholder */}
        <h2 className="md-block hidden" style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text)" }}>
          Dashboard
        </h2>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
        <button style={{ 
          background: "none", 
          border: "none", 
          cursor: "pointer", 
          position: "relative",
          padding: "0.5rem",
          borderRadius: "50%",
          transition: "background 0.2s"
        }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = "var(--color-surface-hover)"}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}
        >
          <Bell size={20} color="var(--color-text-secondary)" />
          <span style={{ 
            position: "absolute", top: 6, right: 6, 
            width: 8, height: 8, 
            backgroundColor: "var(--color-danger)", 
            borderRadius: "50%",
            border: "1px solid white"
          }} />
        </button>
        
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "0.75rem", 
          paddingLeft: "1.5rem", 
          borderLeft: "1px solid var(--color-border)",
          cursor: "pointer"
        }}>
          <img 
            src={`https://ui-avatars.com/api/?name=${user?.name || "User"}&background=10B981&color=fff`} 
            alt="Profile" 
            style={{ 
              width: "40px", 
              height: "40px", 
              borderRadius: "50%", 
              objectFit: "cover",
              border: "2px solid white",
              boxShadow: "var(--shadow-sm)"
            }} 
          />
          <div className="md-block hidden">
             <ChevronDown size={16} color="var(--color-text-tertiary)" />
          </div>
        </div>
      </div>
    </header>
  );
}
