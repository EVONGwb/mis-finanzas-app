import { useState, useEffect } from "react";
import { Card, StatsCard } from "../components/ui/Card";
import { Filter, DollarSign, Calendar, TrendingDown } from "lucide-react";
import MonthlyExpenses from "./expenses/MonthlyExpenses";
import DailyExpenses from "./expenses/DailyExpenses";
import { apiFetch } from "../lib/api";
import { getToken } from "../lib/auth";
import { useCurrency } from "../context/CurrencyContext";

export default function Expenses() {
  const { formatCurrency } = useCurrency();
  const [viewType, setViewType] = useState("monthly"); // "monthly" or "daily"
  
  // Filter state (Shared between tabs)
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  // Totals state
  const [totals, setTotals] = useState({ monthlyPlanned: 0, monthlyPaid: 0, daily: 0, totalPlanned: 0, totalPaid: 0 });

  useEffect(() => {
    fetchTotals();
  }, [month, year]);

  const fetchTotals = async () => {
    try {
      // Fetch monthly expenses total
      const resMonthly = await apiFetch(`/monthly-expenses/status?month=${month}&year=${year}`, { token: getToken() });
      const monthlyPlanned = resMonthly.data?.reduce((sum, item) => sum + Number(item.amount || 0), 0) || 0;
      const monthlyPaid = resMonthly.data?.reduce((sum, item) => sum + (item.status === 'confirmed' ? Number(item.amount || 0) : 0), 0) || 0;

      // Fetch daily expenses total
      const resDaily = await apiFetch("/expenses", { token: getToken() });
      const dailyTotal = resDaily.data?.filter(item => {
        const d = new Date(item.date);
        return d.getMonth() + 1 === month && d.getFullYear() === year && (item.type || "daily") === "daily";
      }).reduce((sum, item) => sum + Number(item.amount || 0), 0) || 0;

      setTotals({
        monthlyPlanned,
        monthlyPaid,
        daily: dailyTotal,
        totalPlanned: monthlyPlanned + dailyTotal,
        totalPaid: monthlyPaid + dailyTotal
      });
    } catch (error) {
      console.error("Error calculating totals:", error);
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: "5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.875rem" }}>Gastos</h1>
          <p style={{ color: "var(--color-text-secondary)" }}>Controla en qué se va tu dinero</p>
        </div>
      </div>

      {/* Totals Summary Card (Consolidated) */}
      <Card style={{ marginBottom: "1.5rem", background: "linear-gradient(135deg, #1F2937 0%, #111827 100%)", color: "white", border: "none" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <DollarSign size={20} className="text-primary" />
            <h3 style={{ fontSize: "1.1rem", fontWeight: 600 }}>Resumen de Gastos</h3>
          </div>
          <div style={{ fontSize: "0.8rem", opacity: 0.7, backgroundColor: "rgba(255,255,255,0.1)", padding: "0.25rem 0.75rem", borderRadius: "99px" }}>
            {new Date(year, month - 1).toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1px 1fr 1px 1fr", alignItems: "center", gap: "0.5rem" }}>
          {/* Estimated */}
          <div style={{ textAlign: "center" }}>
            <span style={{ fontSize: "0.75rem", opacity: 0.7, display: "block", marginBottom: "0.25rem" }}>Total Previsto</span>
            <span style={{ fontSize: "1.1rem", fontWeight: "bold", color: "white" }}>{formatCurrency(totals.totalPlanned)}</span>
          </div>
          
          {/* Divider */}
          <div style={{ width: "1px", height: "40px", backgroundColor: "rgba(255,255,255,0.1)" }}></div>

          {/* Paid */}
          <div style={{ textAlign: "center" }}>
            <span style={{ fontSize: "0.75rem", opacity: 0.7, display: "block", marginBottom: "0.25rem" }}>Total Pagado</span>
            <span style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#34D399" }}>{formatCurrency(totals.totalPaid)}</span>
          </div>

          {/* Divider */}
          <div style={{ width: "1px", height: "40px", backgroundColor: "rgba(255,255,255,0.1)" }}></div>

          {/* Pending */}
          <div style={{ textAlign: "center" }}>
            <span style={{ fontSize: "0.75rem", opacity: 0.7, display: "block", marginBottom: "0.25rem" }}>Pendiente</span>
            <span style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#F87171" }}>{formatCurrency(totals.totalPlanned - totals.totalPaid)}</span>
          </div>
        </div>
      </Card>

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
        <MonthlyExpenses month={month} year={year} onUpdate={fetchTotals} />
      ) : (
        <DailyExpenses month={month} year={year} onUpdate={fetchTotals} />
      )}
    </div>
  );
}
