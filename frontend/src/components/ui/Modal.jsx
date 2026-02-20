import { X } from "lucide-react";

export function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 50,
      padding: "1rem"
    }}>
      <div style={{
        backgroundColor: "var(--color-surface)",
        borderRadius: "var(--radius-lg)",
        width: "100%",
        maxWidth: "500px",
        boxShadow: "var(--shadow-lg)",
        animation: "fadeIn 0.2s ease-out"
      }}>
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          padding: "1.5rem",
          borderBottom: "1px solid var(--color-border)"
        }}>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 600 }}>{title}</h3>
          <button 
            onClick={onClose}
            style={{ 
              background: "transparent", 
              border: "none", 
              cursor: "pointer", 
              padding: "0.25rem",
              color: "var(--color-text-secondary)"
            }}
          >
            <X size={20} />
          </button>
        </div>
        <div style={{ padding: "1.5rem" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
