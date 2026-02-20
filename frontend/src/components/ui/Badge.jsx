export function Badge({ children, variant = "default" }) {
  const variants = {
    default: { bg: "var(--color-secondary)", color: "var(--color-primary)" },
    success: { bg: "var(--color-success-bg)", color: "var(--color-success)" },
    danger: { bg: "var(--color-danger-bg)", color: "var(--color-danger)" },
    warning: { bg: "#FEF3C7", color: "var(--color-warning)" },
  };

  const style = variants[variant] || variants.default;

  return (
    <span style={{
      backgroundColor: style.bg,
      color: style.color,
      padding: "0.25rem 0.75rem",
      borderRadius: "var(--radius-full)",
      fontSize: "0.75rem",
      fontWeight: 600,
      display: "inline-block"
    }}>
      {children}
    </span>
  );
}
