export function Table({ headers, children }) {
  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
            {headers.map((h, i) => (
              <th key={i} style={{ 
                padding: "1rem", 
                textAlign: "left", 
                fontSize: "0.875rem", 
                fontWeight: 600, 
                color: "var(--color-text-secondary)" 
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
      borderBottom: "1px solid var(--color-border)", 
      transition: "background-color 0.1s" 
    }}
    onMouseOver={(e) => e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.01)"}
    onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}
    >
      {children}
    </tr>
  );
}

export function TableCell({ children, className = "" }) {
  return (
    <td className={className} style={{ padding: "1rem", fontSize: "0.875rem", color: "var(--color-text)" }}>
      {children}
    </td>
  );
}
