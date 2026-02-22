import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { getToken } from "../lib/auth";
import { StatsCard, Card } from "../components/ui/Card";
import { TrendingUp, TrendingDown, DollarSign, Wallet, ArrowUpRight, ArrowDownRight, CreditCard } from "lucide-react";
import { Skeleton } from "../components/ui/Skeleton";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

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
    <div className="animate-fade-in" style={{ paddingBottom: "4rem" }}>
      <div style={{ marginBottom: "2.5rem", display: "flex", justifyContent: "space-between", alignItems: "end" }}>
        <div>
          <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem", color: "var(--color-text)", letterSpacing: "-0.02em" }}>Dashboard</h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "1rem" }}>
            Resumen financiero de <span style={{ color: "var(--color-text)", fontWeight: 600 }}>{new Date().toLocaleString('es-ES', { month: 'long', year: 'numeric' })}</span>
          </p>
        </div>
        <div className="md-block hidden">
          <div style={{ 
            padding: "0.5rem 1rem", 
            backgroundColor: "var(--color-surface)", 
            border: "1px solid var(--color-border)", 
            borderRadius: "var(--radius-full)",
            fontSize: "0.875rem",
            color: "var(--color-text-secondary)",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            boxShadow: "var(--shadow-sm)"
          }}>
            <span style={{ width: "8px", height: "8px", backgroundColor: "var(--color-success)", borderRadius: "50%" }}></span>
            Datos actualizados
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ 
        display: "grid", 
        gap: "1.5rem", 
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        marginBottom: "2rem"
      }}>
        {loading ? (
          <>
            <Skeleton height="160px" borderRadius="16px" />
            <Skeleton height="160px" borderRadius="16px" />
            <Skeleton height="160px" borderRadius="16px" />
            <Skeleton height="160px" borderRadius="16px" />
          </>
        ) : (
          <>
            <StatsCard 
              title="Ingresos" 
              value={`$${summary?.totals.incomes.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
              icon={ArrowUpRight}
              color="success"
              trend={12.5}
              subtext="vs mes anterior"
            />
            <StatsCard 
              title="Gastos" 
              value={`$${summary?.totals.expenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
              icon={ArrowDownRight}
              color="danger"
              trend={-2.4}
              subtext="vs mes anterior"
            />
            <StatsCard 
              title="Beneficio Neto" 
              value={`$${summary?.totals.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
              icon={Wallet}
              color="primary"
              subtext={`${summary?.counts.incomes + summary?.counts.expenses} movimientos`}
            />
            <StatsCard 
              title="Saldo Banco" 
              value={`$${(summary?.totals.balance * 1.5).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} // Mock balance logic
              icon={CreditCard}
              color="info"
              subtext="Disponible total"
            />
          </>
        )}
      </div>

      {/* Charts Section */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
        <Card title="Resumen Mensual" className="col-span-2">
          <div style={{ height: "300px", width: "100%", marginTop: "1rem" }}>
            {summary?.chartData?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={summary.chartData}>
                  <defs>
                    <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-success)" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-danger)" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="var(--color-danger)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--color-text-secondary)', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--color-text-secondary)', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--color-surface)', borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-lg)' }}
                    itemStyle={{ fontSize: '14px', fontWeight: 500 }}
                  />
                  <Area type="monotone" dataKey="ingresos" stroke="var(--color-success)" strokeWidth={3} fillOpacity={1} fill="url(#colorIngresos)" name="Ingresos" />
                  <Area type="monotone" dataKey="gastos" stroke="var(--color-danger)" strokeWidth={3} fillOpacity={1} fill="url(#colorGastos)" name="Gastos" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--color-text-secondary)" }}>
                No hay datos para mostrar este mes
              </div>
            )}
          </div>
        </Card>

        <Card title="Categorías de Gastos">
           <div style={{ height: "300px", width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
             {summary?.expensesByCategory?.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary.expensesByCategory} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={80} tick={{fill: 'var(--color-text-secondary)'}} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px' }} />
                    <Bar dataKey="value" fill="var(--color-primary)" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
               </ResponsiveContainer>
             ) : (
               <div style={{ color: "var(--color-text-secondary)" }}>Sin gastos registrados</div>
             )}
           </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card title="Actividad Reciente">
        <div style={{ display: "flex", flexDirection: "column" }}>
          {summary?.recentActivity?.length > 0 ? (
            summary.recentActivity.map((item, i) => (
              <div key={item._id || i} style={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "space-between", 
                padding: "1rem 0",
                borderBottom: i < summary.recentActivity.length - 1 ? "1px solid var(--color-border)" : "none"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{ 
                    width: "40px", height: "40px", 
                    borderRadius: "50%", 
                    backgroundColor: item.type === 'income' ? "var(--color-success-bg)" : "var(--color-danger-bg)",
                    color: item.type === 'income' ? "var(--color-success)" : "var(--color-danger)",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    {item.type === 'income' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: "var(--color-text)" }}>{item.title || "Sin descripción"}</div>
                    <div style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
                      {new Date(item.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div style={{ 
                  fontWeight: 700, 
                  color: item.type === 'income' ? "var(--color-success)" : "var(--color-text)",
                  fontSize: "1rem"
                }}>
                  {item.type === 'income' ? "+" : "-"}${Math.abs(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-secondary)" }}>
              No hay movimientos recientes
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
