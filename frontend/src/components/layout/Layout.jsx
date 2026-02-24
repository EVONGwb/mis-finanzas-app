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
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "rgba(255, 255, 255, 0.9)", // Translucid
        backdropFilter: "blur(10px)",
        borderTop: "1px solid var(--color-border)", 
        display: "flex",
        justifyContent: "space-around", // Even spacing
        alignItems: "center",
        padding: "1rem 2rem", 
        paddingBottom: "2rem", // Safe area
        zIndex: 50,
        boxShadow: "0 -4px 20px rgba(0,0,0,0.05)",
      }}>
        {/* 1. INICIO */}
        <NavLink to="/dashboard" style={({ isActive }) => ({
          display: "flex", flexDirection: "column", alignItems: "center", gap: "6px",
          color: isActive ? "var(--color-primary)" : "#9CA3AF",
          fontSize: "0.75rem", fontWeight: isActive ? 700 : 500, textDecoration: "none",
          transform: isActive ? "scale(1.1)" : "scale(1)",
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
        })}>
          {({ isActive }) => (
            <>
              <LayoutDashboard size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span>Inicio</span>
            </>
          )}
        </NavLink>

        {/* 2. HORAS (Deliveries) */}
        <NavLink to="/deliveries" style={({ isActive }) => ({
          display: "flex", flexDirection: "column", alignItems: "center", gap: "6px",
          color: isActive ? "var(--color-primary)" : "#9CA3AF",
          fontSize: "0.75rem", fontWeight: isActive ? 700 : 500, textDecoration: "none",
          transform: isActive ? "scale(1.1)" : "scale(1)",
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
        })}>
          {({ isActive }) => (
             <>
               <Briefcase size={24} strokeWidth={isActive ? 2.5 : 2} />
               <span>Horas</span>
             </>
          )}
        </NavLink>

        {/* 3. GASTOS */}
        <NavLink to="/expenses" style={({ isActive }) => ({
          display: "flex", flexDirection: "column", alignItems: "center", gap: "6px",
          color: isActive ? "var(--color-primary)" : "#9CA3AF",
          fontSize: "0.75rem", fontWeight: isActive ? 700 : 500, textDecoration: "none",
          transform: isActive ? "scale(1.1)" : "scale(1)",
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
        })}>
          {({ isActive }) => (
             <>
               <TrendingDown size={24} strokeWidth={isActive ? 2.5 : 2} />
               <span>Gastos</span>
             </>
          )}
        </NavLink>
      </div>
    </div>
  );
}
