import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { getToken } from "../lib/auth";
import { Card, StatsCard } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { CheckCircle, Lock } from "lucide-react";

export default function Closing() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [closed, setClosed] = useState(false); // Simulación local

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/summary?year=${year}&month=${month}`, { token: getToken() });
      setSummary(res.data);
      // Reset simulated closed state when changing period
      setClosed(false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [month, year]);

  const handleCloseMonth = () => {
    // Aquí iría la llamada al backend si existiera endpoint de cerrar mes.
    // Como no existe, simulamos el cierre visualmente.
    setClosed(true);
    alert(`Mes de ${new Date(0, month - 1).toLocaleString('es-ES', { month: 'long' })} cerrado correctamente. (Simulación)`);
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.875rem" }}>Cierre Mensual</h1>
          <p style={{ color: "var(--color-text-secondary)" }}>Revisión y cierre de periodos</p>
        </div>
      </div>

      <div style={{ display: "grid", gap: "2rem", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
        <Card>
          <div style={{ marginBottom: "1.5rem" }}>
            <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>Seleccionar Periodo</h3>
            <div style={{ display: "flex", gap: "1rem" }}>
              <select 
                value={month} 
                onChange={(e) => setMonth(e.target.value)}
                style={{ padding: "0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", flex: 1 }}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('es-ES', { month: 'long' })}</option>
                ))}
              </select>
              <select 
                value={year} 
                onChange={(e) => setYear(e.target.value)}
                style={{ padding: "0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", flex: 1 }}
              >
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
              </select>
            </div>
          </div>

          <div style={{ 
            padding: "1.5rem", 
            backgroundColor: closed ? "var(--color-success-bg)" : "var(--color-background)", 
            borderRadius: "var(--radius-md)",
            textAlign: "center",
            marginBottom: "1.5rem",
            border: closed ? "1px solid var(--color-success)" : "1px solid var(--color-border)"
          }}>
            <div style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", marginBottom: "0.5rem" }}>Estado del periodo</div>
            <Badge variant={closed ? "success" : "warning"}>
              {closed ? "CERRADO" : "ABIERTO"}
            </Badge>
          </div>

          <Button 
            variant="primary" 
            style={{ width: "100%" }} 
            onClick={handleCloseMonth}
            disabled={closed || loading}
          >
            {closed ? <><Lock size={18} /> Mes Cerrado</> : <><CheckCircle size={18} /> Cerrar Mes</>}
          </Button>
        </Card>

        {summary && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <StatsCard 
              title="Balance Final" 
              value={`$${summary.totals.balance.toLocaleString()}`} 
              color="primary"
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <StatsCard 
                title="Ingresos" 
                value={`$${summary.totals.incomes.toLocaleString()}`} 
                color="success"
              />
              <StatsCard 
                title="Gastos" 
                value={`$${summary.totals.expenses.toLocaleString()}`} 
                color="danger"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
