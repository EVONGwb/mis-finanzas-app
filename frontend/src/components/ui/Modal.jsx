import { X } from "lucide-react";

export function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "flex-end", // Align to bottom on mobile
      justifyContent: "center",
      zIndex: 100, // Higher than bottom nav (50)
      padding: 0 // Remove padding to allow full width/height
    }}>
      <div 
        className="modal-content"
        style={{
          backgroundColor: "var(--color-surface)",
          borderTopLeftRadius: "1.5rem", // Rounded top only
          borderTopRightRadius: "1.5rem",
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          width: "100%",
          maxWidth: "500px", // Keep desktop constraint
          maxHeight: "100dvh", // Allow full screen height if needed
          height: "auto", // Auto height up to max
          display: "flex",
          flexDirection: "column",
          boxShadow: "var(--shadow-lg)",
          animation: "slideUp 0.3s ease-out",
          margin: 0 // Flush with bottom
        }}
      >
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          padding: "1rem 1.5rem",
          borderBottom: "1px solid var(--color-border)",
          flexShrink: 0
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
        <div style={{ 
          padding: "1.5rem",
          overflowY: "auto", // Internal scroll only if needed
          overscrollBehavior: "contain",
          flex: 1
        }}>
          {children}
        </div>
      </div>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @media (min-width: 640px) {
          .modal-content {
            border-radius: var(--radius-lg) !important;
            margin: 1rem !important;
            align-self: center !important;
            max-height: 85vh !important;
          }
          div[style*="align-items: flex-end"] {
            align-items: center !important;
            padding: 1rem !important;
          }
        }
      `}</style>
    </div>
  );
}
