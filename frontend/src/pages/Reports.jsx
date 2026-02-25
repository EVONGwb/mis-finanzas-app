import { useState, useEffect } from "react";
import { apiFetch } from "../lib/api";
import { getToken } from "../lib/auth";
import { Card } from "../components/ui/Card";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { FileText, TrendingDown, TrendingUp } from "lucide-react";

const COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#6366F1", "#8B5CF6"];

export default function Reports() {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = getToken();
        const now = new Date();
        // Fetch expenses for current month for category breakdown
        const expensesRes = await apiFetch("/expenses", { token });
        setExpenses(expensesRes.data);

        // Fetch monthly summary for totals
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

  // Process data for charts
  const categoryData = expenses.reduce((acc, item) => {
    const cat = item.category || "General";
    acc[cat] = (acc[cat] || 0) + item.amount;
    return acc;
  }, {});

  const pieData = Object.keys(categoryData).map(key => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value: categoryData[key]
  }));

  const barData = summary ? [
    { name: "Ingresos", amount: summary.totals.incomes },
    { name: "Gastos", amount: summary.totals.expenses },
    { name: "Beneficio", amount: summary.totals.balance }
  ] : [];

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <FileText className="text-primary" /> Reportes
        </h1>
        <p style={{ color: "var(--color-text-secondary)" }}>Análisis visual de tus finanzas este mes</p>
      </div>

      {loading ? (
        <div>Cargando reportes...</div>
      ) : (
        <div style={{ display: "grid", gap: "2rem", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
          
          {/* Expenses by Category */}
          <Card>
            <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <TrendingDown size={18} className="text-danger" /> Gastos por Categoría
            </h3>
            <div style={{ height: "300px", width: "100%" }}>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-secondary)" }}>
                  No hay datos de gastos
                </div>
              )}
            </div>
          </Card>

          {/* Income vs Expenses */}
          <Card>
            <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <TrendingUp size={18} className="text-success" /> Balance General
            </h3>
            <div style={{ height: "300px", width: "100%" }}>
              {summary ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                    <Bar dataKey="amount" fill="var(--color-primary)" radius={[4, 4, 0, 0]} barSize={50}>
                      {barData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.name === "Gastos" ? "var(--color-danger)" : entry.name === "Ingresos" ? "var(--color-success)" : "var(--color-primary)"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-secondary)" }}>
                  No hay datos de balance
                </div>
              )}
            </div>
          </Card>

        </div>
      )}
    </div>
  );
}
