export function Skeleton({ height = "20px", width = "100%", borderRadius = "var(--radius-sm)" }) {
  return (
    <div style={{
      height,
      width,
      borderRadius,
      backgroundColor: "#e5e7eb",
      animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
    }} />
  );
}
