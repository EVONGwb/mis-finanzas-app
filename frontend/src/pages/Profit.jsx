import { useState, useEffect } from "react";
import { apiFetch } from "../lib/api";
import { getToken } from "../lib/auth";
import { Card } from "../components/ui/Card";
import { 
  TrendingUp, 
  DollarSign, 
  Percent, 
  ArrowRight, 
  Wallet, 
  PiggyBank, 
  AlertCircle 
} from "lucide-react";

export default function Profit() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchData();
  }, [month, year]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const summaryRes = await apiFetch(`/summary?year=${year}&month=${month}`, { token });
      setSummary(summaryRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const profitMargin = summary && summary.totals.incomes > 0 
    ? ((summary.totals.balance / summary.totals.incomes) * 100).toFixed(1) 
    : 0;

  const projectedAnnualSavings = summary ? summary.totals.balance * 12 : 0;

  const monthName = new Date(year, month - 1).toLocaleString('es-ES', { month: 'long' });

  return (
    <div className="animate-fade-in" style={{ paddingBottom: "5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <TrendingUp className="text-success" /> Beneficio Neto
          </h1>
          <p style={{ color: "var(--color-text-secondary)" }}>Rentabilidad de {monthName} {year}</p>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-secondary)" }}>Calculando beneficio...</div>
      ) : summary ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          
          {/* 1. Main Profit Display */}
          <div style={{ 
            background: "linear-gradient(135deg, var(--color-success) 0%, #059669 100%)", 
            borderRadius: "var(--radius-lg)", 
            padding: "2rem", 
            color: "white",
            boxShadow: "0 10px 15px -3px rgba(16, 185, 129, 0.3)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h2 style={{ fontSize: "1rem", fontWeight: 500, opacity: 0.9, marginBottom: "0.5rem" }}>Beneficio Neto del Mes</h2>
                <div style={{ fontSize: "3.5rem", fontWeight: "bold", lineHeight: 1 }}>
                  ${summary.totals.balance.toLocaleString()}
                </div>
                <div style={{ marginTop: "1rem", display: "inline-flex", alignItems: "center", gap: "0.5rem", backgroundColor: "rgba(255,255,255,0.2)", padding: "0.25rem 0.75rem", borderRadius: "99px", fontSize: "0.875rem" }}>
                  <TrendingUp size={14} />
                  <span>{profitMargin}% de margen de beneficio</span>
                </div>
              </div>
              <div style={{ 
                width: "60px", height: "60px", 
                backgroundColor: "rgba(255,255,255,0.2)", 
                borderRadius: "50%", 
                display: "flex", alignItems: "center", justifyContent: "center" 
              }}>
                <Wallet size={30} color="white" />
              </div>
            </div>
          </div>

          {/* 2. Money Flow Visualization (Waterfall) */}
          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem", color: "var(--color-text)" }}>Flujo del Dinero</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              
              {/* Income */}
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem", backgroundColor: "var(--color-surface)", borderRadius: "var(--radius-md)", borderLeft: "4px solid var(--color-success)" }}>
                <div style={{ padding: "0.5rem", borderRadius: "50%", backgroundColor: "var(--color-success-bg)" }}>
                  <DollarSign size={20} className="text-success" />
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ display: "block", fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>Ingresos Totales</span>
                  <span style={{ fontSize: "1.1rem", fontWeight: "bold" }}>${summary.totals.incomes.toLocaleString()}</span>
                </div>
              </div>

              {/* Arrow */}
              <div style={{ display: "flex", justifyContent: "center" }}>
                <ArrowRight size={20} style={{ transform: "rotate(90deg)", color: "var(--color-border)" }} />
              </div>

              {/* Expenses */}
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem", backgroundColor: "var(--color-surface)", borderRadius: "var(--radius-md)", borderLeft: "4px solid var(--color-danger)" }}>
                <div style={{ padding: "0.5rem", borderRadius: "50%", backgroundColor: "var(--color-danger-bg)" }}>
                  <DollarSign size={20} className="text-danger" />
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ display: "block", fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>Gastos Totales</span>
                  <span style={{ fontSize: "1.1rem", fontWeight: "bold" }}>-${summary.totals.expenses.toLocaleString()}</span>
                </div>
              </div>

              {/* Arrow */}
              <div style={{ display: "flex", justifyContent: "center" }}>
                <ArrowRight size={20} style={{ transform: "rotate(90deg)", color: "var(--color-border)" }} />
              </div>

              {/* Profit */}
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem", backgroundColor: "var(--color-surface)", borderRadius: "var(--radius-md)", border: "2px solid var(--color-success)" }}>
                <div style={{ padding: "0.5rem", borderRadius: "50%", backgroundColor: "var(--color-success-bg)" }}>
                  <PiggyBank size={20} className="text-success" />
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ display: "block", fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>Se queda en tu bolsillo</span>
                  <span style={{ fontSize: "1.25rem", fontWeight: "bold", color: "var(--color-success)" }}>${summary.totals.balance.toLocaleString()}</span>
                </div>
              </div>

            </div>
          </div>

          {/* 3. Projections & Tips */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem" }}>
            <Card>
              <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <TrendingUp size={16} className="text-primary" /> Proyección Anual
              </h3>
              <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", marginBottom: "0.5rem" }}>
                Si mantienes este ritmo, en un año habrás ahorrado:
              </p>
              <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--color-primary)" }}>
                ${projectedAnnualSavings.toLocaleString()}
              </div>
            </Card>

            <Card style={{ backgroundColor: "var(--color-surface-hover)" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <AlertCircle size={16} className="text-warning" /> Consejo
              </h3>
              <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
                {parseFloat(profitMargin) < 20 
                  ? "Tu margen es bajo (<20%). Revisa tus gastos fijos o intenta aumentar tus ingresos para mejorar tu salud financiera."
                  : "¡Tienes un margen saludable! Considera invertir el excedente en tus Objetivos para hacerlo crecer."}
              </p>
            </Card>
          </div>

        </div>
      ) : (
        <div>No hay datos disponibles</div>
      )}
    </div>
  );
}
