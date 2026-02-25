import { useState } from "react";
import { Card } from "../components/ui/Card";
import { Filter } from "lucide-react";
import MonthlyExpenses from "./expenses/MonthlyExpenses";
import DailyExpenses from "./expenses/DailyExpenses";

export default function Expenses() {
  const [viewType, setViewType] = useState("monthly"); // "monthly" or "daily"
  
  // Filter state (Shared between tabs)
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  return (
    <div className="animate-fade-in" style={{ paddingBottom: "5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.875rem" }}>Gastos</h1>
          <p style={{ color: "var(--color-text-secondary)" }}>Controla en qué se va tu dinero</p>
        </div>
      </div>

      {/* View Type Toggles */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
        <button
          onClick={() => setViewType("monthly")}
          style={{
            flex: 1,
            padding: "1rem",
            backgroundColor: viewType === "monthly" ? "var(--color-danger)" : "var(--color-surface)",
            color: viewType === "monthly" ? "white" : "var(--color-text)",
            border: viewType === "monthly" ? "none" : "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s",
            textAlign: "center",
            boxShadow: viewType === "monthly" ? "var(--shadow-md)" : "none"
          }}
        >
          Gastos Mensuales
          <span style={{ display: "block", fontSize: "0.75rem", fontWeight: 400, opacity: 0.9, marginTop: "0.25rem" }}>
            Fijos (Alquiler, Luz, Internet...)
          </span>
        </button>
        <button
          onClick={() => setViewType("daily")}
          style={{
            flex: 1,
            padding: "1rem",
            backgroundColor: viewType === "daily" ? "var(--color-warning)" : "var(--color-surface)",
            color: viewType === "daily" ? "white" : "var(--color-text)",
            border: viewType === "daily" ? "none" : "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s",
            textAlign: "center",
            boxShadow: viewType === "daily" ? "var(--shadow-md)" : "none"
          }}
        >
          Gastos Diarios
          <span style={{ display: "block", fontSize: "0.75rem", fontWeight: 400, opacity: 0.9, marginTop: "0.25rem" }}>
            Variables (Café, Cine, Compras...)
          </span>
        </button>
      </div>

      {/* Shared Date Filter */}
      <Card style={{ marginBottom: "1.5rem" }} padding="1rem">
        <div style={{ display: "flex", gap: "1rem", alignItems: "center", width: "100%" }}>
          <Filter size={18} color="var(--color-text-secondary)" />
          <select 
            value={month} 
            onChange={(e) => setMonth(Number(e.target.value))}
            style={{ 
              padding: "0.5rem", 
              borderRadius: "var(--radius-sm)", 
              border: "1px solid var(--color-border)",
              flex: 1
            }}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('es-ES', { month: 'long' })}</option>
            ))}
          </select>
          <select 
            value={year} 
            onChange={(e) => setYear(Number(e.target.value))}
            style={{ 
              padding: "0.5rem", 
              borderRadius: "var(--radius-sm)", 
              border: "1px solid var(--color-border)",
              flex: 1
            }}
          >
            <option value="2024">2024</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
            <option value="2027">2027</option>
          </select>
        </div>
      </Card>

      {/* Content */}
      {viewType === "monthly" ? (
        <MonthlyExpenses month={month} year={year} />
      ) : (
        <DailyExpenses month={month} year={year} />
      )}
    </div>
  );
}
