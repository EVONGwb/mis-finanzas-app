export function Card({ children, className = "", padding = "1.5rem", title, action }) {
  return (
    <div 
      className={className}
      style={{
        backgroundColor: "var(--color-surface)",
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--shadow-md)", // Softer, more diffuse shadow
        border: "1px solid var(--color-border)",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.2s, box-shadow 0.2s"
      }}
    >
      {(title || action) && (
        <div style={{ 
          padding: "1.25rem 1.5rem", 
          borderBottom: "1px solid var(--color-border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          {title && <h3 style={{ fontSize: "1.125rem", fontWeight: 600 }}>{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      <div style={{ padding: padding, flex: 1 }}>
        {children}
      </div>
    </div>
  );
}

export function StatsCard({ title, value, icon: Icon, subtext, color = "primary", trend }) {
  const colorMap = {
    primary: "var(--color-primary)",
    danger: "var(--color-danger)",
    success: "var(--color-success)",
    warning: "var(--color-warning)",
    info: "var(--color-secondary)"
  };

  const bgMap = {
    primary: "rgba(var(--color-primary-rgb), 0.1)",
    danger: "var(--color-danger-bg)",
    success: "var(--color-success-bg)",
    warning: "var(--color-warning-bg)",
    info: "#EFF6FF" // Light blue
  };

  return (
    <div style={{
      backgroundColor: "var(--color-surface)",
      borderRadius: "var(--radius-md)",
      boxShadow: "var(--shadow-md)",
      border: "1px solid var(--color-border)",
      padding: "1.5rem",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      height: "100%",
      transition: "transform 0.2s ease",
      cursor: "default"
    }}
    onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
    onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
        <div>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.25rem" }}>{title}</p>
          <h3 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-text)", letterSpacing: "-0.5px" }}>{value}</h3>
        </div>
        {Icon && (
          <div style={{ 
            padding: "10px", 
            borderRadius: "12px", 
            backgroundColor: bgMap[color] || bgMap.primary,
            color: colorMap[color],
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <Icon size={22} />
          </div>
        )}
      </div>
      
      {(subtext || trend) && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
          {trend && (
             <span style={{ 
               color: trend > 0 ? "var(--color-success)" : "var(--color-danger)",
               fontWeight: 600,
               display: "flex",
               alignItems: "center",
               gap: "2px",
               backgroundColor: trend > 0 ? "var(--color-success-bg)" : "var(--color-danger-bg)",
               padding: "2px 6px",
               borderRadius: "4px",
               fontSize: "0.75rem"
             }}>
               {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
             </span>
          )}
          <span style={{ color: "var(--color-text-tertiary)" }}>
            {subtext}
          </span>
        </div>
      )}
    </div>
  );
}
