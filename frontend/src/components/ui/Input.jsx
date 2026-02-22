export function Input({ label, error, icon: Icon, iconColor, rightElement, ...props }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", width: "100%" }}>
      {label && (
        <label style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--color-text-secondary)", marginLeft: "0.25rem" }}>
          {label}
        </label>
      )}
      <div style={{ position: "relative", display: "flex", alignItems: "center", width: "100%" }}>
        {Icon && (
          <div style={{ 
            position: "absolute", 
            left: "1rem", 
            color: iconColor || "var(--color-text-tertiary)",
            pointerEvents: "none",
            display: "flex"
          }}>
            <Icon size={20} />
          </div>
        )}
        <input
          style={{
            padding: "0.75rem",
            paddingLeft: Icon ? "3rem" : "1rem",
            paddingRight: rightElement ? "3rem" : "1rem",
            borderRadius: "var(--radius-md)",
            border: `1px solid ${error ? "var(--color-danger)" : "var(--color-border)"}`,
            fontSize: "1rem",
            outline: "none",
            transition: "all 0.2s",
            width: "100%",
            backgroundColor: "var(--color-surface)",
            height: "50px" // Taller inputs for mobile
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "var(--color-primary)";
            e.target.style.boxShadow = "0 0 0 3px rgba(var(--color-primary-rgb), 0.1)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = error ? "var(--color-danger)" : "var(--color-border)";
            e.target.style.boxShadow = "none";
          }}
          {...props}
        />
        {rightElement && (
          <div style={{ 
            position: "absolute", 
            right: "1rem", 
            display: "flex",
            alignItems: "center"
          }}>
            {rightElement}
          </div>
        )}
      </div>
      {error && (
        <span style={{ fontSize: "0.75rem", color: "var(--color-danger)", marginLeft: "0.25rem" }}>
          {error}
        </span>
      )}
    </div>
  );
}
