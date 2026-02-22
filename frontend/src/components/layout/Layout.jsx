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
        borderTop: "1px solid var(--color-border)",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        padding: "0.75rem 0",
        zIndex: 50,
        boxShadow: "0 -2px 10px rgba(0,0,0,0.05)"
      }}>
        <NavLink to="/dashboard" style={({ isActive }) => ({
          display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
          color: isActive ? "var(--color-primary)" : "var(--color-text-tertiary)",
          fontSize: "0.75rem", fontWeight: isActive ? 600 : 500, textDecoration: "none"
        })}>
          <LayoutDashboard size={24} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/deliveries" style={({ isActive }) => ({
          display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
          color: isActive ? "var(--color-primary)" : "var(--color-text-tertiary)",
          fontSize: "0.75rem", fontWeight: isActive ? 600 : 500, textDecoration: "none"
        })}>
          <Briefcase size={24} />
          <span>Entregas</span>
        </NavLink>
        {/* Placeholder for "Banco" - using Expenses/Incomes or a new page if exists. 
            User asked for "Banco", let's map it to a generic view or Expenses for now if no Bank page exists.
            Actually, let's just put a placeholder link or map to Expenses/Incomes combo.
            User said "Banco" module... I don't have a Bank module. I'll link to Expenses as placeholder or create a dummy.
            Let's link to /expenses for now but label "Banco" as requested visually.
        */}
        <NavLink to="/expenses" style={({ isActive }) => ({
          display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
          color: isActive ? "var(--color-primary)" : "var(--color-text-tertiary)",
          fontSize: "0.75rem", fontWeight: isActive ? 600 : 500, textDecoration: "none"
        })}>
          <CreditCard size={24} />
          <span>Banco</span>
        </NavLink>
        <NavLink to="/closing" style={({ isActive }) => ({
          display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
          color: isActive ? "var(--color-primary)" : "var(--color-text-tertiary)",
          fontSize: "0.75rem", fontWeight: isActive ? 600 : 500, textDecoration: "none"
        })}>
          <FileText size={24} />
          <span>Reportes</span>
        </NavLink>
      </div>
    </div>
  );
}
