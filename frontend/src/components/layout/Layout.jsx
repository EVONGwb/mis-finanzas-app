import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, TrendingUp, TrendingDown, Briefcase, FileText, CreditCard } from "lucide-react";

export function Layout({ children, onLogout, user }) {
  const initialDesktop = window.innerWidth >= 768;
  const [sidebarOpen, setSidebarOpen] = useState(initialDesktop);
  const [isDesktop, setIsDesktop] = useState(initialDesktop);

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 768;
      setIsDesktop(desktop);
      if (desktop) setSidebarOpen(true);
      else setSidebarOpen(false);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--color-background)" }}>
      {/* Desktop Sidebar (hidden on mobile) */}
      <div className="md-block hidden">
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
          onLogout={onLogout}
          user={user}
        />
      </div>
      
      <div style={{ 
        flex: 1, 
        display: "flex", 
        flexDirection: "column",
        marginLeft: isDesktop ? "280px" : "0",
        transition: "margin-left 0.3s ease-in-out",
        width: "100%",
        maxWidth: "100vw",
        marginBottom: isDesktop ? "0" : "80px" // Space for bottom nav on mobile
      }}>
        {/* Header only visible on Desktop now as per new mobile design request? 
            Actually, the user asked for a "Header superior" on mobile too. 
            So we keep Header but maybe simplified. 
        */}
        <Header 
          onMenuClick={() => setSidebarOpen(true)} 
          user={user}
        />
        
        <main style={{ padding: "1.5rem", flex: 1, overflowY: "auto" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md-hidden" style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "var(--color-surface)",
        borderTop: "1px solid var(--color-border)", // Keep very subtle or remove if needed
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        padding: "0.75rem 0",
        paddingBottom: "1.5rem", // Extra padding for iPhone home indicator
        zIndex: 50,
        boxShadow: "0 -4px 20px rgba(0,0,0,0.05)"
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
      </div>
    </div>
  );
}
