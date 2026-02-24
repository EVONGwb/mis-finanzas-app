import { Menu, Bell, ChevronDown, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export function Header({ onMenuClick, user }) {
  const navigate = useNavigate();
  const [logoError, setLogoError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Capitalize month properly
  const date = new Date();
  const monthName = date.toLocaleString('es-ES', { month: 'long' });
  const year = date.getFullYear();
  const currentMonth = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Small delay to show animation
    setTimeout(() => {
      window.location.reload();
    }, 300);
  };

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
        {!logoError ? (
          <img 
            src="/logo.png" 
            alt="M" 
            style={{ 
              width: "40px", height: "40px", 
              borderRadius: "12px", // Squircle as per design
              objectFit: "contain",
              // boxShadow: "0 4px 10px rgba(16, 185, 129, 0.3)" 
            }}
            onError={() => setLogoError(true)}
          />
        ) : (
          <div style={{ 
            width: "40px", height: "40px", 
            borderRadius: "12px", 
            background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontWeight: "bold",
            fontSize: "1.2rem",
            boxShadow: "0 4px 10px rgba(16, 185, 129, 0.3)"
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
          </div>
        )}
        <div>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 900, color: "#111827", lineHeight: 1.1, letterSpacing: "-0.5px" }}>Mis Finanzas</h1>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        {/* Refresh Button - High Contrast for visibility */}
        <button 
          onClick={handleRefresh}
          style={{
            backgroundColor: "#F3F4F6", // Light gray
            border: "1px solid #E5E7EB", // Gray border
            cursor: "pointer",
            width: "40px", height: "40px", // Slightly larger
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#374151", // Dark gray text
            transition: "all 0.2s ease",
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
            marginRight: "0.5rem"
          }}
          title="Actualizar Aplicación"
        >
          <RefreshCw 
            size={20} 
            className={isRefreshing ? "animate-spin" : ""} 
            strokeWidth={2.5}
          />
        </button>

        {/* User Avatar */}
        <div 
          onClick={() => navigate('/profile')} 
          style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "0.75rem", 
            cursor: "pointer",
            backgroundColor: "#F3F4F6", // Light grey circle background
            borderRadius: "50%",
            padding: "2px",
            border: "1px solid #E5E7EB"
          }}
        >
          <div style={{
            width: "36px", height: "36px", borderRadius: "50%",
            backgroundColor: "#E5E7EB", display: "flex", alignItems: "center", justifyContent: "center",
            color: "#374151", fontWeight: "bold", fontSize: "0.9rem"
          }}>
             {user?.name ? user.name.substring(0, 2).toUpperCase() : "PM"}
          </div>
        </div>
      </div>
    </header>
  );
}
