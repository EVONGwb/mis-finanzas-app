import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";

export function Modal({ isOpen, onClose, title, children }) {
  const contentRef = useRef(null);

  // Auto-scroll to focused input to prevent keyboard from covering it
  useEffect(() => {
    if (!isOpen) return;

    const handleFocus = (e) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) {
        setTimeout(() => {
          e.target.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 300);
      }
    };

    const contentEl = contentRef.current;
    if (contentEl) {
      contentEl.addEventListener("focus", handleFocus, true);
    }

    return () => {
      if (contentEl) {
        contentEl.removeEventListener("focus", handleFocus, true);
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center", // Changed from flex-end to center to avoid keyboard issues
      justifyContent: "center",
      zIndex: 9999,
      padding: "1rem" // Added padding for mobile spacing
    }}>
      <div 
        ref={contentRef}
        className="modal-content"
        style={{
          backgroundColor: "var(--color-surface)",
          borderRadius: "1.5rem", // Fully rounded
          width: "100%",
          maxWidth: "500px",
          maxHeight: "90dvh", // Slightly less than 100 to allow margins
          height: "auto",
          display: "flex",
          flexDirection: "column",
          boxShadow: "var(--shadow-lg)",
          animation: "slideUp 0.3s ease-out",
          margin: "0 auto",
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
          overflowY: "auto",
          overscrollBehavior: "contain",
          flex: 1
        }}>
          {children}
        </div>
      </div>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>,
    document.body
  );
}
