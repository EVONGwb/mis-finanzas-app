import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { getToken } from "../lib/auth";
import { StatsCard, Card } from "../components/ui/Card";
import { TrendingUp, TrendingDown, Wallet, CreditCard, ArrowUpRight, ArrowDownRight, Coffee, ShoppingBag, Home, Zap, MoreHorizontal, ChevronDown } from "lucide-react";
import { Skeleton } from "../components/ui/Skeleton";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setError("");
        const token = getToken();
        
        // Attempt to get fresh user data from context or local storage on mount
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
           // Fallback if not in local storage yet (rare if logged in)
           const resUser = await apiFetch("/auth/me", { token });
           if (resUser.data) {
             setUser(resUser.data);
             localStorage.setItem("user", JSON.stringify(resUser.data));
           }
        }

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
      
      <div style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {/* User Greeting centered/prominent instead of just "Dashboard" */}
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "0.75rem",
          width: "100%",
          justifyContent: "space-between"
        }}>
           <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text)", letterSpacing: "-0.5px" }}>
             Hola, {user?.name?.split(' ')[0] || "Usuario"} 👋
           </h1>
           
           {/* Month Selector Compact */}
           <div style={{ 
             display: "flex", 
             alignItems: "center", 
             gap: "0.25rem", 
             backgroundColor: "var(--color-surface)", 
             padding: "0.5rem 0.75rem", 
             borderRadius: "99px", 
             border: "1px solid var(--color-border)",
             color: "var(--color-text-secondary)",
             fontWeight: 600,
             fontSize: "0.8rem",
             boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
           }}>
             <span style={{ textTransform: "capitalize" }}>{new Date().toLocaleString('es-ES', { month: 'long' })}</span>
             <ChevronDown size={14} />
           </div>
        </div>
      </div>
      
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
          <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--color-text)" }}>Resumen Semanal</h3>
          <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--color-success)" }}>+250 h</div>
        </div>
        <Card padding="1rem">
          <div style={{ height: "180px", width: "100%" }}>
            {summary?.chartData?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={summary.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dy={10} interval="preserveStartEnd" />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} tickFormatter={(value) => `€${value}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Area type="monotone" dataKey="ingresos" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorIngresos)" dot={{ r: 4, fill: "#fff", stroke: "#10B981", strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  <Area type="monotone" dataKey="gastos" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorGastos)" dot={{ r: 4, fill: "#fff", stroke: "#3B82F6", strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--color-text-tertiary)", fontSize: "0.875rem" }}>
                Sin datos suficientes
              </div>
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: "2rem", marginTop: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", fontWeight: 500, color: "var(--color-text-secondary)" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#10B981" }}></div> Ingresos
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", fontWeight: 500, color: "var(--color-text-secondary)" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#3B82F6" }}></div> Gastos
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
                borderRadius: "16px", // Softer border radius like image
                border: "1px solid var(--color-border)",
                boxShadow: "0 2px 5px rgba(0,0,0,0.02)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{ 
                    width: "48px", height: "48px", // Larger icon box
                    borderRadius: "12px", 
                    backgroundColor: item.type === 'income' ? "#10B981" : "#EF4444", // Solid colors like image
                    color: "white",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: item.type === 'income' ? "0 4px 6px -1px rgba(16, 185, 129, 0.3)" : "0 4px 6px -1px rgba(239, 68, 68, 0.3)"
                  }}>
                    {/* Icon based on category or type */}
                    {item.category === 'Hogar' ? <Home size={24} /> : 
                     item.category === 'Comida' ? <Coffee size={24} /> :
                     item.category === 'Compras' ? <ShoppingBag size={24} /> :
                     item.type === 'income' ? <ArrowUpRight size={24} /> : <Zap size={24} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: "var(--color-text)", fontSize: "1rem" }}>{item.title || "Sin título"}</div>
                    <div style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", marginTop: "2px" }}>
                      {item.category || "General"}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ 
                    fontWeight: 700, 
                    color: item.type === 'income' ? "#10B981" : "#EF4444",
                    fontSize: "1rem"
                  }}>
                    {item.type === 'income' ? "+" : "-"}${Math.abs(item.amount).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </div>
                   <div style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", marginTop: "2px" }}>
                      €{Math.abs(item.amount).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} {/* Mock secondary currency if needed or just repeated value style */}
                   </div>
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
