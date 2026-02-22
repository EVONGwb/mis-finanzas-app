import { Loader2 } from "lucide-react";

export function Button({ 
  children, 
  variant = "primary", 
  size = "md", 
  isLoading, 
  disabled, 
  className = "",
  style = {},
  ...props 
}) {
  // Map internal variant names to CSS classes or style objects
  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return {
          backgroundColor: "var(--color-primary)",
          color: "#ffffff",
          boxShadow: "0 2px 4px rgba(var(--color-primary-rgb), 0.3)",
          border: "1px solid transparent"
        };
      case "secondary":
        return {
          backgroundColor: "var(--color-surface)",
          color: "var(--color-text)",
          border: "1px solid var(--color-border)",
          boxShadow: "var(--shadow-sm)"
        };
      case "outline":
        return {
          backgroundColor: "transparent",
          border: "1px solid var(--color-border)",
          color: "var(--color-text)",
        };
      case "danger":
        return {
          backgroundColor: "var(--color-danger)",
          color: "white",
          boxShadow: "0 2px 4px rgba(239, 68, 68, 0.3)",
          border: "1px solid transparent"
        };
      case "ghost":
        return {
          backgroundColor: "transparent",
          color: "var(--color-text-secondary)",
          border: "none",
          boxShadow: "none"
        };
      case "success":
        return {
          backgroundColor: "var(--color-success)",
          color: "white",
          boxShadow: "0 2px 4px rgba(16, 185, 129, 0.3)",
          border: "1px solid transparent"
        };
      default:
        return {};
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case "sm": return { padding: "0.5rem 1rem", fontSize: "0.875rem", height: "32px" };
      case "md": return { padding: "0.75rem 1.5rem", fontSize: "0.95rem", height: "42px" };
      case "lg": return { padding: "1rem 2rem", fontSize: "1.125rem", height: "52px" };
      case "icon": return { padding: 0, width: "40px", height: "40px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" };
      default: return {};
    }
  };

  const baseStyles = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    borderRadius: "var(--radius-full)", // Modern pill buttons
    fontWeight: 600,
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    cursor: disabled || isLoading ? "not-allowed" : "pointer",
    outline: "none",
    fontFamily: "var(--font-family)",
    opacity: disabled || isLoading ? 0.6 : 1,
    ...getVariantStyles(),
    ...getSizeStyles(),
    ...style
  };

  return (
    <button 
      disabled={disabled || isLoading} 
      style={baseStyles}
      className={className}
      {...props}
      onMouseOver={(e) => {
        if (disabled || isLoading) return;
        e.currentTarget.style.transform = "translateY(-1px)";
        if (variant === 'primary') {
          e.currentTarget.style.backgroundColor = "var(--color-primary-dark)";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(var(--color-primary-rgb), 0.4)";
        }
        if (variant === 'secondary' || variant === 'outline') {
          e.currentTarget.style.backgroundColor = "var(--color-surface-hover)";
          e.currentTarget.style.borderColor = "var(--color-text-tertiary)";
        }
        if (variant === 'ghost') {
          e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.05)";
          e.currentTarget.style.color = "var(--color-text)";
        }
      }}
      onMouseOut={(e) => {
        if (disabled || isLoading) return;
        e.currentTarget.style.transform = "translateY(0)";
        const original = getVariantStyles();
        e.currentTarget.style.backgroundColor = original.backgroundColor;
        e.currentTarget.style.boxShadow = original.boxShadow;
        e.currentTarget.style.borderColor = original.border?.split(' ')[2] || 'transparent'; // Reset border color roughly
        if (variant === 'ghost') e.currentTarget.style.color = "var(--color-text-secondary)";
      }}
      onMouseDown={(e) => {
        if (!disabled && !isLoading) e.currentTarget.style.transform = "translateY(1px)";
      }}
      onMouseUp={(e) => {
        if (!disabled && !isLoading) e.currentTarget.style.transform = "translateY(-1px)";
      }}
    >
      {isLoading && <Loader2 className="animate-spin" size={18} />}
      {children}
    </button>
  );
}
