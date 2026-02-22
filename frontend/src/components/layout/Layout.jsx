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
        justifyContent: "space-around",
        alignItems: "center",
        padding: "0.75rem 0",
        paddingBottom: "1.5rem", 
        zIndex: 50,
        boxShadow: "0 -4px 20px rgba(0,0,0,0.05)",
        maxWidth: "100vw"
      }}>
        <NavLink to="/dashboard" style={({ isActive }) => ({
          display: "flex", flexDirection: "column", alignItems: "center", gap: "6px",
          color: isActive ? "#10B981" : "#9CA3AF",
          fontSize: "0.7rem", fontWeight: isActive ? 700 : 500, textDecoration: "none"
        })}>
          {({ isActive }) => (
            <>
              <div style={{
                backgroundColor: isActive ? "#D1FAE5" : "transparent",
                borderRadius: "50%",
                padding: "8px",
                transition: "all 0.2s"
              }}>
                <LayoutDashboard size={20} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span>Dashboard</span>
            </>
          )}
        </NavLink>
        <NavLink to="/deliveries" style={({ isActive }) => ({
          display: "flex", flexDirection: "column", alignItems: "center", gap: "6px",
          color: isActive ? "#10B981" : "#9CA3AF",
          fontSize: "0.7rem", fontWeight: isActive ? 700 : 500, textDecoration: "none"
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
        <NavLink to="/expenses" style={({ isActive }) => ({
          display: "flex", flexDirection: "column", alignItems: "center", gap: "6px",
          color: isActive ? "#10B981" : "#9CA3AF",
          fontSize: "0.7rem", fontWeight: isActive ? 700 : 500, textDecoration: "none"
        })}>
          {({ isActive }) => (
             <>
               <div style={{
                 backgroundColor: isActive ? "#D1FAE5" : "transparent",
                 borderRadius: "50%",
                 padding: "8px",
                 transition: "all 0.2s"
               }}>
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isActive ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M5 21V7"/><path d="M19 21V11"/><path d="M12 21V3"/><polyline points="2 7 5 7 5 3"/><line x1="12" y1="6" x2="12" y2="6"/><line x1="12" y1="14" x2="12" y2="14"/><line x1="19" y1="14" x2="19" y2="14"/></svg>
               </div>
               <span>Banco</span>
             </>
          )}
        </NavLink>
        <NavLink to="/closing" style={({ isActive }) => ({
          display: "flex", flexDirection: "column", alignItems: "center", gap: "6px",
          color: isActive ? "#10B981" : "#9CA3AF",
          fontSize: "0.7rem", fontWeight: isActive ? 700 : 500, textDecoration: "none"
        })}>
          {({ isActive }) => (
             <>
               <div style={{
                 backgroundColor: isActive ? "#D1FAE5" : "transparent",
                 borderRadius: "50%",
                 padding: "8px",
                 transition: "all 0.2s"
               }}>
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isActive ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>
               </div>
               <span>Reportes</span>
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
            background: "none", border: "none"
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
