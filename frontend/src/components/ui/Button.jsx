import { Loader2 } from "lucide-react";

export function Button({ 
  children, 
  variant = "primary", 
  size = "md", 
  isLoading, 
  disabled, 
  className = "",
  ...props 
}) {
  const baseStyles = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    borderRadius: "var(--radius-sm)",
    fontWeight: 500,
    transition: "all 0.2s ease",
    cursor: "pointer",
    border: "none",
    outline: "none",
    fontFamily: "inherit"
  };

  const variants = {
    primary: {
      backgroundColor: "var(--color-primary)",
      color: "#ffffff",
      boxShadow: "var(--shadow-sm)",
    },
    secondary: {
      backgroundColor: "var(--color-secondary)",
      color: "var(--color-primary)",
    },
    outline: {
      backgroundColor: "transparent",
      border: "1px solid var(--color-border)",
      color: "var(--color-text)",
    },
    danger: {
      backgroundColor: "var(--color-danger)",
      color: "white",
    },
    ghost: {
      backgroundColor: "transparent",
      color: "var(--color-text-secondary)",
    }
  };

  const sizes = {
    sm: { padding: "0.4rem 0.8rem", fontSize: "0.875rem" },
    md: { padding: "0.6rem 1.2rem", fontSize: "1rem" },
    lg: { padding: "0.8rem 1.6rem", fontSize: "1.125rem" },
    icon: { padding: "0.5rem", width: "40px", height: "40px", borderRadius: "50%" }
  };

  const style = {
    ...baseStyles,
    ...variants[variant],
    ...sizes[size],
    opacity: disabled || isLoading ? 0.7 : 1,
    cursor: disabled || isLoading ? "not-allowed" : "pointer",
  };

  return (
    <button 
      disabled={disabled || isLoading} 
      style={style} 
      className={className}
      {...props}
      onMouseOver={(e) => {
        if (!disabled && !isLoading) {
          if (variant === 'primary') e.currentTarget.style.backgroundColor = "var(--color-primary-hover)";
          if (variant === 'ghost') e.currentTarget.style.backgroundColor = "var(--color-background)";
        }
      }}
      onMouseOut={(e) => {
        if (!disabled && !isLoading) {
          if (variant === 'primary') e.currentTarget.style.backgroundColor = "var(--color-primary)";
          if (variant === 'ghost') e.currentTarget.style.backgroundColor = "transparent";
        }
      }}
    >
      {isLoading && <Loader2 className="animate-spin" size={16} />}
      {children}
    </button>
  );
}
