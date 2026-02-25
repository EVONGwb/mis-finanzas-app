import { useState, useEffect } from "react";
import { apiFetch } from "../lib/api";
import { getToken } from "../lib/auth";
import { Card, StatsCard } from "../components/ui/Card";
import { TrendingUp, DollarSign, Percent } from "lucide-react";

export default function Profit() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = getToken();
        const now = new Date();
        const summaryRes = await apiFetch(`/summary?year=${now.getFullYear()}&month=${now.getMonth() + 1}`, { token });
        setSummary(summaryRes.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const profitMargin = summary && summary.totals.incomes > 0 
    ? ((summary.totals.balance / summary.totals.incomes) * 100).toFixed(1) 
    : 0;

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <TrendingUp className="text-success" /> Beneficio Neto
        </h1>
        <p style={{ color: "var(--color-text-secondary)" }}>Rentabilidad real de tu mes actual</p>
      </div>

      {loading ? (
        <div>Cargando datos de beneficio...</div>
      ) : summary ? (
        <div style={{ display: "grid", gap: "2rem", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
          
          {/* Main Profit Card */}
          <Card style={{ background: "linear-gradient(135deg, var(--color-success) 0%, #059669 100%)", color: "white" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 600, opacity: 0.9 }}>Beneficio Neto</h3>
              <DollarSign size={24} style={{ opacity: 0.8 }} />
            </div>
            <div style={{ fontSize: "3rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
              ${summary.totals.balance.toLocaleString()}
            </div>
            <div style={{ fontSize: "0.875rem", opacity: 0.9 }}>
              Total disponible después de gastos
            </div>
          </Card>

          {/* Margin Card */}
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--color-text)" }}>Margen de Beneficio</h3>
              <Percent size={24} className="text-primary" />
            </div>
            <div style={{ fontSize: "3rem", fontWeight: "bold", color: "var(--color-primary)" }}>
              {profitMargin}%
            </div>
            <div style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
              De tus ingresos, esto es lo que realmente ganas
            </div>
          </Card>

          {/* Breakdown */}
          <Card>
            <h3 style={{ fontSize: "1.1rem", marginBottom: "1.5rem", fontWeight: 600 }}>Desglose Simple</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "var(--color-text-secondary)" }}>Ingresos Totales</span>
                <span style={{ fontWeight: 600, color: "var(--color-success)" }}>+${summary.totals.incomes.toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "var(--color-text-secondary)" }}>Gastos Totales</span>
                <span style={{ fontWeight: 600, color: "var(--color-danger)" }}>-${summary.totals.expenses.toLocaleString()}</span>
              </div>
              <div style={{ borderTop: "1px solid var(--color-border)", margin: "0.5rem 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 600 }}>Beneficio</span>
                <span style={{ fontWeight: "bold", fontSize: "1.1rem", color: "var(--color-success)" }}>${summary.totals.balance.toLocaleString()}</span>
              </div>
            </div>
          </Card>

        </div>
      ) : (
        <div>No hay datos disponibles</div>
      )}
    </div>
  );
}
