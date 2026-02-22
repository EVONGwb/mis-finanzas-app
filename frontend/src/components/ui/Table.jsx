export function Table({ headers, children }) {
  if (!headers) {
    return (
      <div style={{ width: "100%", overflowX: "auto", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, minWidth: "600px" }}>
          {children}
        </table>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", overflowX: "auto", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
      <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, minWidth: "600px" }}>
        <thead>
          <tr style={{ backgroundColor: "var(--color-surface-hover)" }}>
            {headers.map((h, i) => (
              <th key={i} style={{ 
                padding: "1rem 1.5rem", 
                textAlign: "left", 
                fontSize: "0.75rem", 
                fontWeight: 600, 
                color: "var(--color-text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                borderBottom: "1px solid var(--color-border)",
                whiteSpace: "nowrap"
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {children}
        </tbody>
      </table>
    </div>
  );
}

export function TableRow({ children }) {
  return (
    <tr style={{ 
      transition: "background-color 0.1s" 
    }}
    onMouseOver={(e) => e.currentTarget.style.backgroundColor = "var(--color-surface-hover)"}
    onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}
    >
      {children}
    </tr>
  );
}

export function TableCell({ children, className = "", align = "left" }) {
  return (
    <td className={className} style={{ 
      padding: "1rem 1.5rem", 
      fontSize: "0.875rem", 
      color: "var(--color-text)",
      borderBottom: "1px solid var(--color-border)",
      textAlign: align,
      verticalAlign: "middle"
    }}>
      {children}
    </td>
  );
}
