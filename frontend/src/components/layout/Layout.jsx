import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, TrendingUp, TrendingDown, Briefcase, FileText, CreditCard } from "lucide-react";

export function Layout({ children, onLogout, user }) {
  // Always hidden by default, acts as a Drawer
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--color-background)" }}>
      {/* Sidebar - Always Rendered but acts as Drawer (controlled by sidebarOpen) */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        onLogout={onLogout}
        user={user}
      />
      
      <div style={{ 
        flex: 1, 
        display: "flex", 
        flexDirection: "column",
        width: "100%",
        maxWidth: "100vw",
        marginBottom: "80px", // Always space for bottom nav
        transition: "all 0.3s ease"
      }}>
        {/* Header - Desktop & Mobile */}
        <Header 
          onMenuClick={() => setSidebarOpen(true)} 
          user={user}
        />
        
        <main style={{ padding: "1.5rem", flex: 1, overflowY: "auto" }}>
          <div style={{ maxWidth: "800px", margin: "0 auto" }}> {/* Limited width for "App" feel */}
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation - SOLO 3 ICONOS */}
      <div style={{
        position: "fixed",
        bottom: "1rem", // Floating
        left: "1rem",
        right: "1rem",
        backgroundColor: "rgba(255, 255, 255, 0.95)", // More solid
        backdropFilter: "blur(16px)",
        borderRadius: "24px", // Rounded pill
        display: "flex",
        justifyContent: "space-between", // Space between items
        alignItems: "center",
        padding: "0.75rem 2rem", 
        zIndex: 50,
        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
        maxWidth: "400px", // Limit width on large screens
        margin: "0 auto" // Center
      }}>
        {/* 1. INICIO */}
        <NavLink to="/dashboard" style={({ isActive }) => ({
          display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
          color: isActive ? "#10B981" : "#9CA3AF",
          fontSize: "0.75rem", fontWeight: isActive ? 700 : 500, textDecoration: "none",
        })}>
          {({ isActive }) => (
            <>
               <div style={{
                 backgroundColor: isActive ? "#D1FAE5" : "transparent",
                 color: isActive ? "#059669" : "inherit",
                 padding: "8px",
                 borderRadius: "12px",
                 display: "flex", alignItems: "center", justifyContent: "center",
                 transition: "all 0.2s ease"
               }}>
                 {isActive ? (
                    <LayoutDashboard size={24} strokeWidth={2.5} fill="#059669" fillOpacity={0.2} />
                 ) : (
                    <LayoutDashboard size={24} strokeWidth={2} />
                 )}
               </div>
              <span style={{ fontSize: "0.7rem" }}>Inicio</span>
            </>
          )}
        </NavLink>

        {/* 2. HORAS (Deliveries) */}
        <NavLink to="/deliveries" style={({ isActive }) => ({
          display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
          color: isActive ? "#374151" : "#9CA3AF",
          fontSize: "0.75rem", fontWeight: isActive ? 700 : 500, textDecoration: "none",
        })}>
          {({ isActive }) => (
             <>
                <div style={{ padding: "8px" }}>
                   <Briefcase size={24} strokeWidth={isActive ? 2.5 : 2} />
                </div>
               <span style={{ fontSize: "0.7rem" }}>Horas</span>
             </>
          )}
        </NavLink>

        {/* 3. GASTOS */}
        <NavLink to="/expenses" style={({ isActive }) => ({
          display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
          color: isActive ? "#EF4444" : "#9CA3AF",
          fontSize: "0.75rem", fontWeight: isActive ? 700 : 500, textDecoration: "none",
        })}>
          {({ isActive }) => (
             <>
                <div style={{ padding: "8px" }}>
                   <TrendingDown size={24} strokeWidth={isActive ? 2.5 : 2} />
                </div>
               <span style={{ fontSize: "0.7rem" }}>Gastos</span>
             </>
          )}
        </NavLink>
      </div>
    </div>
  );
}
