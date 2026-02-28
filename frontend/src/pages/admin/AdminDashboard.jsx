import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";
import { getToken } from "../../lib/auth";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Table, TableRow, TableCell } from "../../components/ui/Table";
import { Users, TrendingUp, TrendingDown, Activity, DollarSign } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await apiFetch("/admin/dashboard", { token: getToken() });
        setStats(res.data);
      } catch (e) {
        setError(e.message || "Error cargando dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>Cargando...</div>;
  if (error) return <div style={{ color: "red", padding: "1rem" }}>{error}</div>;

  const { counts, financials, recentUsers, recentLogs } = stats;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(amount);
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      
      {/* Stats Grid */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", 
        gap: "1.5rem" 
      }}>
        {/* Users Card */}
        <Card style={{ padding: "1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ 
            padding: "1rem", 
            borderRadius: "12px", 
            backgroundColor: "#eff6ff", 
            color: "#3b82f6" 
          }}>
            <Users size={32} />
          </div>
          <div>
            <p style={{ color: "#64748b", fontSize: "0.875rem", fontWeight: 500 }}>Usuarios Totales</p>
            <h3 style={{ fontSize: "1.875rem", fontWeight: 700, color: "#1e293b", margin: 0 }}>{counts.users}</h3>
          </div>
        </Card>

        {/* Income Card */}
        <Card style={{ padding: "1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ 
            padding: "1rem", 
            borderRadius: "12px", 
            backgroundColor: "#ecfdf5", 
            color: "#10b981" 
          }}>
            <TrendingUp size={32} />
          </div>
          <div>
            <p style={{ color: "#64748b", fontSize: "0.875rem", fontWeight: 500 }}>Ingresos Totales</p>
            <h3 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1e293b", margin: 0 }}>{formatCurrency(financials.totalIncomeAmount)}</h3>
            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{counts.incomes} transacciones</span>
          </div>
        </Card>

        {/* Expense Card */}
        <Card style={{ padding: "1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ 
            padding: "1rem", 
            borderRadius: "12px", 
            backgroundColor: "#fef2f2", 
            color: "#ef4444" 
          }}>
            <TrendingDown size={32} />
          </div>
          <div>
            <p style={{ color: "#64748b", fontSize: "0.875rem", fontWeight: 500 }}>Gastos Totales</p>
            <h3 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1e293b", margin: 0 }}>{formatCurrency(financials.totalExpenseAmount)}</h3>
            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{counts.expenses} transacciones</span>
          </div>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1.5rem" }}>
        
        {/* Recent Users */}
        <Card style={{ padding: "0" }}>
          <div style={{ padding: "1.5rem", borderBottom: "1px solid #e2e8f0" }}>
            <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#1e293b", margin: 0 }}>Usuarios Recientes</h3>
          </div>
          <Table>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "1rem", color: "#64748b", fontWeight: 600 }}>Nombre</th>
                <th style={{ textAlign: "left", padding: "1rem", color: "#64748b", fontWeight: 600 }}>Email</th>
                <th style={{ textAlign: "left", padding: "1rem", color: "#64748b", fontWeight: 600 }}>Rol</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map(u => (
                <TableRow key={u._id}>
                  <TableCell style={{ fontWeight: 500 }}>{u.name || "Sin nombre"}</TableCell>
                  <TableCell style={{ color: "#64748b" }}>{u.email}</TableCell>
                  <TableCell>
                    <Badge variant={u.role === "admin" ? "primary" : "neutral"}>{u.role}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {recentUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} style={{ textAlign: "center", color: "#94a3b8" }}>No hay usuarios recientes</TableCell>
                </TableRow>
              )}
            </tbody>
          </Table>
        </Card>

        {/* Recent Logs */}
        <Card style={{ padding: "0" }}>
          <div style={{ padding: "1.5rem", borderBottom: "1px solid #e2e8f0" }}>
            <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#1e293b", margin: 0 }}>Actividad del Sistema</h3>
          </div>
          <div style={{ padding: "0" }}>
             {recentLogs.map((log, i) => (
               <div key={log._id || i} style={{ 
                 padding: "1rem 1.5rem", 
                 borderBottom: i < recentLogs.length - 1 ? "1px solid #f1f5f9" : "none",
                 display: "flex",
                 gap: "1rem",
                 alignItems: "flex-start"
               }}>
                 <div style={{ 
                   minWidth: "32px", height: "32px", 
                   borderRadius: "50%", 
                   backgroundColor: "#f8fafc", 
                   display: "flex", alignItems: "center", justifyContent: "center",
                   color: "#64748b",
                   border: "1px solid #e2e8f0"
                 }}>
                   <Activity size={16} />
                 </div>
                 <div>
                   <p style={{ margin: "0 0 0.25rem 0", fontSize: "0.875rem", color: "#1e293b", fontWeight: 500 }}>
                     {log.action}
                   </p>
                   <p style={{ margin: 0, fontSize: "0.75rem", color: "#64748b" }}>
                     {log.message} • {new Date(log.createdAt).toLocaleString()}
                   </p>
                   {log.actor?.userId && (
                     <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.75rem", color: "#3b82f6" }}>
                       Por: {log.actor.userId.email}
                     </p>
                   )}
                   {!log.actor?.userId && log.actor?.email && (
                      <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.75rem", color: "#3b82f6" }}>
                        Por: {log.actor.email}
                      </p>
                   )}
                 </div>
               </div>
             ))}
             {recentLogs.length === 0 && (
                <div style={{ padding: "2rem", textAlign: "center", color: "#94a3b8" }}>No hay actividad reciente</div>
             )}
          </div>
        </Card>

      </div>
    </div>
  );
}
