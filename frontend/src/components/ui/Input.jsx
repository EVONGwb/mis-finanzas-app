export function Input({ label, error, ...props }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", width: "100%" }}>
      {label && (
        <label style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--color-text-secondary)" }}>
          {label}
        </label>
      )}
      <input
        style={{
          padding: "0.75rem",
          borderRadius: "var(--radius-sm)",
          border: `1px solid ${error ? "var(--color-danger)" : "var(--color-border)"}`,
          fontSize: "1rem",
          outline: "none",
          transition: "border-color 0.2s",
          width: "100%",
          backgroundColor: "var(--color-surface)"
        }}
        onFocus={(e) => e.target.style.borderColor = "var(--color-primary)"}
        onBlur={(e) => e.target.style.borderColor = error ? "var(--color-danger)" : "var(--color-border)"}
        {...props}
      />
      {error && (
        <span style={{ fontSize: "0.75rem", color: "var(--color-danger)" }}>
          {error}
        </span>
      )}
    </div>
  );
}
