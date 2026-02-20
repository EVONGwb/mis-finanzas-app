import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { getToken } from "../lib/auth";
import { StatsCard } from "../components/ui/Card";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { Skeleton } from "../components/ui/Skeleton";

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setError("");
        const token = getToken();
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;

        const res = await apiFetch(`/summary?year=${year}&month=${month}`, { token });
        setSummary(res.data);
      } catch (e) {
        setError(e.message || "Error al cargar datos");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (error) {
    return (
      <div style={{ padding: "1rem", color: "var(--color-danger)", backgroundColor: "var(--color-danger-bg)", borderRadius: "var(--radius-md)" }}>
        Error: {error}
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.875rem", marginBottom: "0.5rem" }}>Dashboard</h1>
        <p style={{ color: "var(--color-text-secondary)" }}>
          Resumen financiero de {new Date().toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div style={{ 
        display: "grid", 
        gap: "1.5rem", 
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" 
      }}>
        {loading ? (
          <>
            <Skeleton height="140px" borderRadius="12px" />
            <Skeleton height="140px" borderRadius="12px" />
            <Skeleton height="140px" borderRadius="12px" />
          </>
        ) : (
          <>
            <StatsCard 
              title="Total Ingresos" 
              value={`$${summary?.totals.incomes.toLocaleString()}`} 
              icon={TrendingUp}
              color="success"
              subtext={`${summary?.counts.incomes} transacciones`}
            />
            <StatsCard 
              title="Total Gastos" 
              value={`$${summary?.totals.expenses.toLocaleString()}`} 
              icon={TrendingDown}
              color="danger"
              subtext={`${summary?.counts.expenses} transacciones`}
            />
            <StatsCard 
              title="Balance Mensual" 
              value={`$${summary?.totals.balance.toLocaleString()}`} 
              icon={DollarSign}
              color="primary"
              subtext={summary?.totals.balance >= 0 ? "Balance positivo" : "Balance negativo"}
            />
          </>
        )}
      </div>
    </div>
  );
}
