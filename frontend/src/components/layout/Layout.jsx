import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { NavLink } from "react-router-dom";
import { LayoutGrid, Clock, Wallet } from "lucide-react";

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
        padding: "0.5rem 2.5rem", // Adjusted padding
        zIndex: 50,
        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
        maxWidth: "400px", // Limit width on large screens
        margin: "0 auto" // Center
      }}>
        {/* 1. INICIO (Now centered visually by moving it to middle position in code?) NO, user wants it CENTERED.
            Wait, user said "inicio tiene que estar en el centro".
            Current order: Inicio, Horas, Gastos.
            New order: Horas, Inicio, Gastos.
        */}

        {/* 1. HORAS (Deliveries) - MOVED TO FIRST POSITION */}
        <NavLink to="/deliveries" style={({ isActive }) => ({
          display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
          color: isActive ? "#374151" : "#374151", // Always dark
          fontSize: "0.75rem", fontWeight: isActive ? 700 : 500, textDecoration: "none",
        })}>
          {({ isActive }) => (
             <>
                <div style={{ padding: "8px" }}>
                   <Clock size={28} strokeWidth={2} color="#374151" />
                </div>
               <span style={{ fontSize: "0.85rem" }}>Horas</span>
             </>
          )}
        </NavLink>

        {/* 2. INICIO - MOVED TO CENTER POSITION */}
        <NavLink to="/dashboard" style={({ isActive }) => ({
          display: "flex", flexDirection: "column", alignItems: "center", gap: "2px",
          color: isActive ? "#10B981" : "#1F2937",
          fontSize: "0.75rem", fontWeight: isActive ? 700 : 500, textDecoration: "none",
          position: "relative"
        })}>
          {({ isActive }) => (
            <>
               <div style={{
                 backgroundColor: isActive ? "rgba(16, 185, 129, 0.1)" : "transparent", // Subtle green background
                 borderRadius: "12px",
                 padding: "6px",
                 display: "flex", alignItems: "center", justifyContent: "center",
                 transition: "all 0.2s ease"
               }}>
                 {isActive ? (
                    // Green filled-ish grid
                    <LayoutGrid size={26} strokeWidth={2.5} color="#10B981" />
                 ) : (
                    // Default grid
                    <LayoutGrid size={26} strokeWidth={2} color="#1F2937" />
                 )}
               </div>
               <span style={{ fontSize: "0.85rem", marginTop: "2px" }}>Inicio</span>
               
               {/* Green Bottom Bar Indicator */}
               {isActive && (
                 <div style={{
                   position: "absolute",
                   bottom: "-8px", // Push it down
                   width: "30px",
                   height: "3px",
                   backgroundColor: "#10B981",
                   borderRadius: "2px"
                 }} />
               )}
            </>
          )}
        </NavLink>

        {/* 3. GASTOS - KEPT IN LAST POSITION */}
        <NavLink to="/expenses" style={({ isActive }) => ({
          display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
          color: isActive ? "#EF4444" : "#374151",
          fontSize: "0.75rem", fontWeight: isActive ? 700 : 500, textDecoration: "none",
        })}>
          {({ isActive }) => (
             <>
                {/* Red Gradient Icon Container */}
                <div style={{ 
                   padding: "6px 10px",
                   background: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
                   borderRadius: "8px",
                   boxShadow: "0 2px 5px rgba(239, 68, 68, 0.3)",
                   display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                   {/* Dollar Sign or Wallet Icon in White */}
                   <span style={{ color: "white", fontWeight: "bold", fontSize: "1.2rem", lineHeight: 1 }}>$</span>
                </div>
               <span style={{ fontSize: "0.85rem", marginTop: "4px" }}>Gastos</span>
             </>
          )}
        </NavLink>
      </div>
    </div>
  );
}
