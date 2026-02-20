export function Card({ children, className = "", padding = "1.5rem" }) {
  return (
    <div 
      className={className}
      style={{
        backgroundColor: "var(--color-surface)",
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--shadow-sm)",
        border: "1px solid var(--color-border)",
        padding: padding,
        height: "100%",
        display: "flex",
        flexDirection: "column"
      }}
    >
      {children}
    </div>
  );
}

export function StatsCard({ title, value, icon: Icon, subtext, trend, color = "primary" }) {
  const colorMap = {
    primary: "var(--color-primary)",
    danger: "var(--color-danger)",
    success: "var(--color-success)",
    warning: "var(--color-warning)"
  };

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
        <span style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem", fontWeight: 500 }}>{title}</span>
        {Icon && (
          <div style={{ 
            padding: "8px", 
            borderRadius: "var(--radius-sm)", 
            backgroundColor: `color-mix(in srgb, ${colorMap[color]} 10%, transparent)`,
            color: colorMap[color]
          }}>
            <Icon size={18} />
          </div>
        )}
      </div>
      <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-text)" }}>
        {value}
      </div>
      {subtext && (
        <div style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", marginTop: "0.25rem" }}>
          {subtext}
        </div>
      )}
    </Card>
  );
}
