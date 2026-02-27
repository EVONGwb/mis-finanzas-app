import { useState, useEffect } from "react";
import { apiFetch } from "../lib/api";
import { getToken } from "../lib/auth";
import { Card } from "../components/ui/Card";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { useCurrency } from "../context/CurrencyContext";
import { 
  FileText, 
  TrendingDown, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight 
} from "lucide-react";

const COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#6366F1", "#8B5CF6", "#EC4899", "#14B8A6"];

const CustomTooltip = ({ active, payload, formatCurrency }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ backgroundColor: "var(--color-surface)", padding: "0.5rem", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-md)" }}>
        <p style={{ fontWeight: "bold", margin: 0 }}>{payload[0].name}</p>
        <p style={{ margin: 0 }}>{formatCurrency ? formatCurrency(payload[0].value) : payload[0].value}</p>
      </div>
    );
  }
  return null;
};

export default function Reports() {
  const { formatCurrency } = useCurrency();
  const [expenses, setExpenses] = useState([]);
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
      // Fetch expenses for selected month/year
      const expensesRes = await apiFetch(`/expenses?year=${year}&month=${month}`, { token });
      setExpenses(expensesRes.data);

      // Fetch summary
      const summaryRes = await apiFetch(`/summary?year=${year}&month=${month}`, { token });
      setSummary(summaryRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Process data for charts
  const categoryData = expenses.reduce((acc, item) => {
    const cat = item.category || "General";
    acc[cat] = (acc[cat] || 0) + item.amount;
    return acc;
  }, {});

  const pieData = Object.keys(categoryData)
    .map(key => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value: categoryData[key]
    }))
    .sort((a, b) => b.value - a.value); // Sort by highest expense

  const barData = summary ? [
    { name: "Ingresos", amount: summary.totals.incomes },
    { name: "Gastos", amount: summary.totals.expenses },
  ] : [];

  const balance = summary ? summary.totals.balance : 0;
  const savingsRate = summary && summary.totals.incomes > 0 
    ? ((balance / summary.totals.incomes) * 100).toFixed(0) 
    : 0;

  const monthName = new Date(year, month - 1).toLocaleString('es-ES', { month: 'long' });

  return (
    <div className="animate-fade-in" style={{ paddingBottom: "5rem" }}>
      {/* Header & Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <FileText className="text-primary" /> Reportes
          </h1>
          <p style={{ color: "var(--color-text-secondary)" }}>Análisis mensual de {monthName} {year}</p>
        </div>
        
        <div style={{ display: "flex", gap: "0.5rem", backgroundColor: "var(--color-surface)", padding: "0.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
          <button 
            onClick={() => {
              if (month === 1) { setMonth(12); setYear(year - 1); }
              else { setMonth(month - 1); }
            }}
            style={{ padding: "0.5rem", border: "none", background: "transparent", cursor: "pointer" }}
          >
            ←
          </button>
          <span style={{ display: "flex", alignItems: "center", fontWeight: "bold", padding: "0 0.5rem", minWidth: "100px", justifyContent: "center", textTransform: "capitalize" }}>
            {monthName}
          </span>
          <button 
            onClick={() => {
              if (month === 12) { setMonth(1); setYear(year + 1); }
              else { setMonth(month + 1); }
            }}
            style={{ padding: "0.5rem", border: "none", background: "transparent", cursor: "pointer" }}
          >
            →
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-secondary)" }}>Cargando datos...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {/* 1. Summary Cards Row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <Card style={{ padding: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>Ingresos</span>
                <ArrowUpRight size={16} className="text-success" />
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{formatCurrency(summary?.totals.incomes)}</div>
            </Card>
            
            <Card style={{ padding: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>Gastos</span>
                <ArrowDownRight size={16} className="text-danger" />
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{formatCurrency(summary?.totals.expenses)}</div>
            </Card>

            <Card style={{ padding: "1rem", backgroundColor: balance >= 0 ? "var(--color-success-bg)" : "var(--color-danger-bg)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.875rem", color: balance >= 0 ? "var(--color-success)" : "var(--color-danger)" }}>Balance Neto</span>
                <DollarSign size={16} color={balance >= 0 ? "var(--color-success)" : "var(--color-danger)"} />
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: balance >= 0 ? "var(--color-success)" : "var(--color-danger)" }}>
                {balance >= 0 ? "+" : ""}{formatCurrency(balance)}
              </div>
            </Card>
          </div>

          {/* 2. Main Analysis Section */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "1.5rem" }}>
            
            {/* Spending Breakdown */}
            <Card>
              <h3 style={{ fontSize: "1.1rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 600 }}>
                <TrendingDown size={18} className="text-danger" /> ¿En qué gastaste?
              </h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ height: "220px", width: "100%" }}>
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip formatCurrency={formatCurrency} />} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-secondary)", flexDirection: "column", gap: "0.5rem" }}>
                      <div style={{ padding: "1rem", borderRadius: "50%", backgroundColor: "var(--color-surface-hover)" }}>
                        <Calendar size={24} />
                      </div>
                      <p>Sin gastos este mes</p>
                    </div>
                  )}
                </div>

                {/* Category List */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {pieData.map((entry, index) => (
                    <div key={index} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.9rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: COLORS[index % COLORS.length] }}></div>
                        <span>{entry.name}</span>
                      </div>
                      <div style={{ display: "flex", gap: "1rem" }}>
                        <span style={{ fontWeight: 600 }}>{formatCurrency(entry.value)}</span>
                        <span style={{ color: "var(--color-text-secondary)", width: "35px", textAlign: "right" }}>
                          {((entry.value / summary.totals.expenses) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Income vs Expenses Bar Chart */}
            <Card>
               <h3 style={{ fontSize: "1.1rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 600 }}>
                <TrendingUp size={18} className="text-success" /> Flujo de Caja
              </h3>
              <div style={{ height: "250px", width: "100%", marginBottom: "1rem" }}>
                {summary && (summary.totals.incomes > 0 || summary.totals.expenses > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} layout="vertical" margin={{ left: 20, right: 20 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={60} tick={{ fontSize: 12 }} />
                      <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip formatCurrency={formatCurrency} />} />
                      <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={30}>
                        {barData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.name === "Gastos" ? "var(--color-danger)" : "var(--color-success)"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-secondary)" }}>
                    No hay movimientos suficientes
                  </div>
                )}
              </div>

              {/* Insights */}
              <div style={{ padding: "1rem", backgroundColor: "var(--color-surface-hover)", borderRadius: "var(--radius-md)" }}>
                <h4 style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.5rem", color: "var(--color-text-secondary)" }}>Tasa de Ahorro</h4>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{ flex: 1, height: "8px", backgroundColor: "#E5E7EB", borderRadius: "99px", overflow: "hidden" }}>
                    <div style={{ width: `${Math.max(0, Math.min(100, savingsRate))}%`, height: "100%", backgroundColor: "var(--color-primary)" }}></div>
                  </div>
                  <span style={{ fontWeight: "bold", color: "var(--color-primary)" }}>{savingsRate}%</span>
                </div>
                <p style={{ fontSize: "0.75rem", marginTop: "0.5rem", color: "var(--color-text-secondary)" }}>
                  {savingsRate > 20 ? "¡Excelente! Estás ahorrando más del 20%." : "Intenta reducir gastos hormiga para aumentar tu ahorro."}
                </p>
              </div>
            </Card>

          </div>
        </div>
      )}
    </div>
  );
}
