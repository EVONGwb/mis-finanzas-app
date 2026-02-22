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

      {/* Mobile Bottom Navigation - Visible on ALL screens now */}
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "var(--color-surface)",
        borderTop: "1px solid var(--color-border)", 
        display: "flex",
        justifyContent: "space-between", // Distribute space
        alignItems: "center",
        padding: "0.75rem 1.5rem", // Add side padding
        paddingBottom: "1.5rem", 
        zIndex: 50,
        boxShadow: "0 -4px 20px rgba(0,0,0,0.05)",
        maxWidth: "100vw"
      }}>
        <NavLink to="/dashboard" style={({ isActive }) => ({
          display: "flex", flexDirection: "column", alignItems: "center", gap: "6px",
          color: isActive ? "#10B981" : "#9CA3AF",
          fontSize: "0.7rem", fontWeight: isActive ? 700 : 500, textDecoration: "none",
          // Center the active Dashboard button
          order: 3, // Position in the center
          marginTop: "-20px" // Slight lift effect
        })}>
          {({ isActive }) => (
            <>
              <div style={{
                backgroundColor: "#10B981", // Always green background for main button
                borderRadius: "50%",
                padding: "12px", // Larger padding
                transition: "all 0.2s",
                boxShadow: "0 4px 10px rgba(16, 185, 129, 0.4)",
                color: "white" // Always white icon
              }}>
                <LayoutDashboard size={24} strokeWidth={2.5} />
              </div>
              <span style={{ color: isActive ? "#10B981" : "#9CA3AF" }}>Inicio</span>
            </>
          )}
        </NavLink>

        <NavLink to="/incomes" style={({ isActive }) => ({
          display: "flex", flexDirection: "column", alignItems: "center", gap: "6px",
          color: isActive ? "#10B981" : "#9CA3AF",
          fontSize: "0.7rem", fontWeight: isActive ? 700 : 500, textDecoration: "none",
          order: 1 // Position 1
        })}>
          {({ isActive }) => (
             <>
               <div style={{
                 backgroundColor: isActive ? "#D1FAE5" : "transparent",
                 borderRadius: "50%",
                 padding: "8px",
                 transition: "all 0.2s"
               }}>
                 <TrendingUp size={20} strokeWidth={isActive ? 2.5 : 2} />
               </div>
               <span>Ingresos</span>
             </>
          )}
        </NavLink>

        <NavLink to="/expenses" style={({ isActive }) => ({
          display: "flex", flexDirection: "column", alignItems: "center", gap: "6px",
          color: isActive ? "#10B981" : "#9CA3AF",
          fontSize: "0.7rem", fontWeight: isActive ? 700 : 500, textDecoration: "none",
          order: 2 // Position 2
        })}>
          {({ isActive }) => (
             <>
               <div style={{
                 backgroundColor: isActive ? "#D1FAE5" : "transparent",
                 borderRadius: "50%",
                 padding: "8px",
                 transition: "all 0.2s"
               }}>
                 <TrendingDown size={20} strokeWidth={isActive ? 2.5 : 2} />
               </div>
               <span>Gastos</span>
             </>
          )}
        </NavLink>

        <NavLink to="/deliveries" style={({ isActive }) => ({
          display: "flex", flexDirection: "column", alignItems: "center", gap: "6px",
          color: isActive ? "#10B981" : "#9CA3AF",
          fontSize: "0.7rem", fontWeight: isActive ? 700 : 500, textDecoration: "none",
          order: 4 // Position 4
        })}>
          {({ isActive }) => (
             <>
               <div style={{
                 backgroundColor: isActive ? "#D1FAE5" : "transparent",
                 borderRadius: "50%",
                 padding: "8px",
                 transition: "all 0.2s"
               }}>
                 <Briefcase size={20} strokeWidth={isActive ? 2.5 : 2} />
               </div>
               <span>Entregas</span>
             </>
          )}
        </NavLink>

        {/* New Menu Button (More/Others) */}
        <button 
          onClick={() => setSidebarOpen(true)}
          style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: "6px",
            color: "#9CA3AF",
            fontSize: "0.7rem", fontWeight: 500, textDecoration: "none",
            background: "none", border: "none",
            order: 5 // Position 5
          }}
        >
          <div style={{
             backgroundColor: "transparent",
             borderRadius: "50%",
             padding: "8px",
             transition: "all 0.2s"
           }}>
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
           </div>
           <span>Menú</span>
        </button>
      </div>
    </div>
  );
}
