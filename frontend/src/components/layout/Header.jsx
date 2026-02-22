import { Menu, Bell, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function Header({ onMenuClick, user }) {
  const navigate = useNavigate();
  // Capitalize month properly
  const date = new Date();
  const monthName = date.toLocaleString('es-ES', { month: 'long' });
  const year = date.getFullYear();
  const currentMonth = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;

  return (
    <header style={{
      height: "80px",
      backgroundColor: "var(--color-surface)",
      borderBottom: "none", // Remove border for cleaner look
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 1.5rem",
      position: "sticky",
      top: 0,
      zIndex: 30,
      boxShadow: "0 4px 20px rgba(0,0,0,0.03)" // Softer shadow
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {/* Logo and App Name (Mobile) */}
        <div style={{ 
          width: "40px", height: "40px", 
          borderRadius: "50%", 
          background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "white", fontWeight: "bold",
          fontSize: "1.2rem",
          boxShadow: "0 4px 10px rgba(16, 185, 129, 0.3)"
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
        </div>
        <div>
          <h1 style={{ fontSize: "1.125rem", fontWeight: 800, color: "#1F2937", lineHeight: 1.1 }}>Mis Finanzas</h1>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        {/* User Avatar */}
        <div 
          onClick={() => navigate('/profile')} 
          style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "0.75rem", 
            cursor: "pointer"
          }}
        >
          <img 
            src={`https://ui-avatars.com/api/?name=${user?.name || "User"}&background=E5E7EB&color=374151`} 
            alt="Profile" 
            style={{ 
              width: "40px", 
              height: "40px", 
              borderRadius: "50%", 
              objectFit: "cover",
              border: "2px solid white",
              boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
            }} 
          />
        </div>
      </div>
    </header>
  );
}
