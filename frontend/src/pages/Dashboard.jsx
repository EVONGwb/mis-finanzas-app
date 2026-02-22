import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { getToken } from "../lib/auth";
import { StatsCard, Card } from "../components/ui/Card";
import { TrendingUp, TrendingDown, Wallet, CreditCard, ArrowUpRight, ArrowDownRight, Coffee, ShoppingBag, Home, Zap, MoreHorizontal } from "lucide-react";
import { Skeleton } from "../components/ui/Skeleton";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
      <div style={{ padding: "1.5rem", color: "var(--color-danger)", backgroundColor: "var(--color-danger-bg)", borderRadius: "var(--radius-md)" }}>
        {error}
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ paddingBottom: "6rem" }}>
      
      {/* KPI Cards Grid (2 Columns Mobile) */}
      <div style={{ 
        display: "grid", 
        gap: "1rem", 
        gridTemplateColumns: "1fr 1fr", // 2 Columns forced
        marginBottom: "1.5rem"
      }}>
        {loading ? (
          <>
            <Skeleton height="140px" borderRadius="16px" />
            <Skeleton height="140px" borderRadius="16px" />
            <Skeleton height="140px" borderRadius="16px" />
            <Skeleton height="140px" borderRadius="16px" />
          </>
        ) : (
          <>
            <StatsCard 
              title="Ingresos" 
              value={`$${summary?.totals.incomes.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} 
              icon={TrendingUp}
              color="success"
              trend={12} // Mock trend
              subtext="vs mes ant."
            />
            <StatsCard 
              title="Gastos" 
              value={`$${summary?.totals.expenses.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} 
              icon={TrendingDown}
              color="danger"
              trend={-5} // Mock trend
              subtext="vs mes ant."
            />
            <StatsCard 
              title="Beneficio" 
              value={`$${summary?.totals.balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} 
              icon={Wallet}
              color="info" // Blue
            />
            <StatsCard 
              title="Banco" 
              value={`$${(summary?.totals.balance * 1.5).toLocaleString(undefined, { maximumFractionDigits: 0 })}`} 
              icon={CreditCard}
              color="primary" // Darker/Brand
            />
          </>
        )}
      </div>

      {/* Visual Summary (Chart) */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--color-text)" }}>Resumen Mensual</h3>
        </div>
        <Card padding="1rem">
          <div style={{ height: "200px", width: "100%" }}>
            {summary?.chartData?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={summary.chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-success)" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-danger)" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="var(--color-danger)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.5} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--color-text-tertiary)', fontSize: 10}} dy={10} minTickGap={15} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--color-text-tertiary)', fontSize: 10}} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--color-surface)', borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="ingresos" stroke="var(--color-success)" strokeWidth={2} fillOpacity={1} fill="url(#colorIngresos)" />
                  <Area type="monotone" dataKey="gastos" stroke="var(--color-danger)" strokeWidth={2} fillOpacity={1} fill="url(#colorGastos)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--color-text-tertiary)", fontSize: "0.875rem" }}>
                Sin datos suficientes
              </div>
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: "1.5rem", marginTop: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "var(--color-success)" }}></div> Ingresos
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "var(--color-danger)" }}></div> Gastos
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity List */}
      <div>
        <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--color-text)", marginBottom: "1rem" }}>Actividad Reciente</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {summary?.recentActivity?.length > 0 ? (
            summary.recentActivity.map((item, i) => (
              <div key={item._id || i} style={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "space-between", 
                padding: "1rem",
                backgroundColor: "var(--color-surface)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
                boxShadow: "var(--shadow-sm)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{ 
                    width: "40px", height: "40px", 
                    borderRadius: "12px", 
                    backgroundColor: item.type === 'income' ? "var(--color-success-bg)" : "var(--color-danger-bg)",
                    color: item.type === 'income' ? "var(--color-success)" : "var(--color-danger)",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    {/* Icon based on category or type */}
                    {item.category === 'Hogar' ? <Home size={20} /> : 
                     item.category === 'Comida' ? <Coffee size={20} /> :
                     item.category === 'Compras' ? <ShoppingBag size={20} /> :
                     item.type === 'income' ? <ArrowUpRight size={20} /> : <Zap size={20} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: "var(--color-text)", fontSize: "0.95rem" }}>{item.title || "Sin título"}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                      {new Date(item.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                </div>
                <div style={{ 
                  fontWeight: 700, 
                  color: item.type === 'income' ? "var(--color-success)" : "var(--color-text)",
                  fontSize: "1rem"
                }}>
                  {item.type === 'income' ? "+" : "-"}${Math.abs(item.amount).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>
              No hay movimientos recientes
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
