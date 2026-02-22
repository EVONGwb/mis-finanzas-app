import { Area, AreaChart, ResponsiveContainer } from "recharts";

export function Card({ children, className = "", padding = "1.5rem", title, action }) {
  return (
    <div 
      className={className}
      style={{
        backgroundColor: "var(--color-surface)",
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--shadow-md)", 
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

export function StatsCard({ title, value, subtext, color = "primary", trend }) {
  // Map internal variant names to gradients and solid colors
  const styles = {
    primary: { // Bank - Blue
      gradient: "linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)",
      stroke: "#60A5FA",
      fill: "rgba(59, 130, 246, 0.3)",
      textColor: "white",
      subTextColor: "rgba(255, 255, 255, 0.8)"
    },
    success: { // Income - Green
      gradient: "linear-gradient(135deg, #065F46 0%, #10B981 100%)",
      stroke: "#34D399",
      fill: "rgba(16, 185, 129, 0.3)",
      textColor: "white",
      subTextColor: "rgba(255, 255, 255, 0.8)"
    },
    danger: { // Expense - Red
      gradient: "linear-gradient(135deg, #991B1B 0%, #EF4444 100%)",
      stroke: "#F87171",
      fill: "rgba(239, 68, 68, 0.3)",
      textColor: "white",
      subTextColor: "rgba(255, 255, 255, 0.8)"
    },
    info: { // Benefit - Light Blue
      gradient: "linear-gradient(135deg, #2563EB 0%, #60A5FA 100%)",
      stroke: "#93C5FD",
      fill: "rgba(96, 165, 250, 0.3)",
      textColor: "white",
      subTextColor: "rgba(255, 255, 255, 0.8)"
    }
  };

  const currentStyle = styles[color] || styles.primary;

  // Mock data for mini chart
  const data = [
    { v: 10 }, { v: 25 }, { v: 15 }, { v: 35 }, { v: 20 }, { v: 45 }, { v: 40 }
  ];

  return (
    <div style={{
      background: currentStyle.gradient,
      borderRadius: "16px",
      padding: "1.25rem",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      height: "140px",
      position: "relative",
      overflow: "hidden",
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      color: currentStyle.textColor
    }}>
      {/* Background Mini Chart */}
      <div style={{ position: "absolute", bottom: -10, left: 0, right: 0, height: "60%", opacity: 0.5, zIndex: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <Area 
              type="monotone" 
              dataKey="v" 
              stroke={currentStyle.stroke} 
              strokeWidth={2} 
              fill={currentStyle.fill} 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Content */}
      <div style={{ zIndex: 1, position: "relative" }}>
        <p style={{ fontSize: "0.875rem", fontWeight: 500, opacity: 0.9, marginBottom: "0.25rem", color: currentStyle.subTextColor }}>{title}</p>
        <h3 style={{ fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.5px" }}>{value}</h3>
      </div>
      
      <div style={{ zIndex: 1, position: "relative", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
        {trend !== undefined && (
           <span style={{ 
             fontWeight: 600,
             display: "flex",
             alignItems: "center",
             gap: "2px",
             fontSize: "0.875rem"
           }}>
             {trend > 0 ? "▲" : "▼"} €{Math.abs(trend)}
           </span>
        )}
      </div>
    </div>
  );
}
