import { useState } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { Header } from "./Header"; // Reusing Header for consistency, or we can make a simpler one
import { Menu } from "lucide-react";

export function AdminLayout({ children, onLogout, user }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f1f5f9" }}>
      {/* Admin Sidebar */}
      <AdminSidebar 
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
        marginLeft: "280px", // Sidebar is fixed width 280px
        transition: "margin-left 0.3s ease"
      }}
      className="admin-content" // We'll add a media query for this
      >
        {/* Simple Header for Admin */}
        <header style={{
          height: "64px",
          backgroundColor: "white",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          padding: "0 2rem",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 30
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button 
              onClick={() => setSidebarOpen(true)}
              className="md-hidden"
              style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
            >
              <Menu size={24} />
            </button>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#1e293b", margin: 0 }}>
              Panel de Administración
            </h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
             {/* Can add notifications or other admin tools here */}
          </div>
        </header>
        
        <main style={{ padding: "2rem", flex: 1, overflowY: "auto" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            {children}
          </div>
        </main>
      </div>
      
      {/* Add responsive styles for sidebar margin */}
      <style>{`
        @media (max-width: 768px) {
          .admin-content {
            margin-left: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
