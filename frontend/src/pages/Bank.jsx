import { useState, useEffect } from "react";
import { apiFetch } from "../lib/api";
import { getToken } from "../lib/auth";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { useCurrency } from "../context/CurrencyContext";
import { 
  Building2, 
  TrendingUp, 
  TrendingDown, 
  Lock, 
  Unlock, 
  Search, 
  Filter, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle,
  AlertCircle
} from "lucide-react";

export default function Bank() {
  const { formatCurrency } = useCurrency();
  const [activeTab, setActiveTab] = useState("balance");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  
  // Filters for Movements
  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchData();
  }, [month, year, filterType]); // Refetch when filters change

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const res = await apiFetch(`/bank?month=${month}&year=${year}&type=${filterType}`, { token });
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseMonth = async () => {
    if (!window.confirm(`¿Estás seguro de cerrar el mes de ${month}/${year}? Esto transferirá el saldo al Banco.`)) return;
    try {
      await apiFetch("/bank/close", {
        method: "POST",
        token: getToken(),
        body: { month, year }
      });
      fetchData();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleOpenMonth = async () => {
    // Password check skipped for now as per instructions (backend handles logic)
    if (!window.confirm(`¿Reabrir el mes de ${month}/${year}? Esto eliminará la transferencia del Banco.`)) return;
    try {
      await apiFetch("/bank/open", {
        method: "POST",
        token: getToken(),
        body: { month, year }
      });
      fetchData();
    } catch (e) {
      alert(e.message);
    }
  };

  const monthName = new Date(year, month - 1).toLocaleString('es-ES', { month: 'long' });
  
  // Derived state for Closings Tab
  // Check if current selected month is closed
  const isCurrentMonthClosed = data?.closings?.some(c => c.month === month && c.year === year);

  return (
    <div className="animate-fade-in" style={{ paddingBottom: "5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Building2 className="text-primary" /> Banco
          </h1>
          <p style={{ color: "var(--color-text-secondary)" }}>Gestión centralizada de tu dinero</p>
        </div>
        
        {/* Month Selector */}
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
            {monthName} {year}
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

      {/* Tabs */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", borderBottom: "1px solid var(--color-border)" }}>
        {["balance", "movements", "closings"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "0.75rem 1rem",
              background: "transparent",
              border: "none",
              borderBottom: activeTab === tab ? "2px solid var(--color-primary)" : "2px solid transparent",
              color: activeTab === tab ? "var(--color-primary)" : "var(--color-text-secondary)",
              fontWeight: activeTab === tab ? 600 : 400,
              cursor: "pointer",
              textTransform: "capitalize"
            }}
          >
            {tab === "balance" ? "Saldo" : tab === "movements" ? "Movimientos" : "Cierres"}
          </button>
        ))}
      </div>

      {loading && !data ? (
        <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-secondary)" }}>Cargando datos...</div>
      ) : (
        <>
          {/* TAB: SALDO */}
          {activeTab === "balance" && data && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {/* Main Balance Card */}
              <div style={{ 
                background: "linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)", 
                borderRadius: "var(--radius-lg)", 
                padding: "2rem", 
                color: "white",
                boxShadow: "0 10px 15px -3px rgba(37, 99, 235, 0.3)"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <h2 style={{ fontSize: "1rem", fontWeight: 500, opacity: 0.9, marginBottom: "0.5rem" }}>Saldo Actual</h2>
                    <div style={{ fontSize: "3.5rem", fontWeight: "bold", lineHeight: 1 }}>
                      {formatCurrency(data.balance)}
                    </div>
                    <div style={{ marginTop: "1rem", display: "inline-flex", alignItems: "center", gap: "0.5rem", backgroundColor: "rgba(255,255,255,0.2)", padding: "0.25rem 0.75rem", borderRadius: "99px", fontSize: "0.875rem" }}>
                      {data.monthStats.variation >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      <span>{data.monthStats.variation >= 0 ? "+" : ""}{formatCurrency(data.monthStats.variation)} este mes</span>
                    </div>
                  </div>
                  <div style={{ 
                    width: "60px", height: "60px", 
                    backgroundColor: "rgba(255,255,255,0.2)", 
                    borderRadius: "50%", 
                    display: "flex", alignItems: "center", justifyContent: "center" 
                  }}>
                    <Building2 size={30} color="white" />
                  </div>
                </div>
              </div>

              {/* Mini Summary */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
                <Card style={{ padding: "1rem", textAlign: "center" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", display: "block", marginBottom: "0.25rem" }}>Ingresos Mes</span>
                  <span style={{ fontSize: "1.1rem", fontWeight: "bold", color: "var(--color-success)" }}>+{formatCurrency(data.monthStats.incomes)}</span>
                </Card>
                <Card style={{ padding: "1rem", textAlign: "center" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", display: "block", marginBottom: "0.25rem" }}>Gastos Mes</span>
                  <span style={{ fontSize: "1.1rem", fontWeight: "bold", color: "var(--color-danger)" }}>-{formatCurrency(Math.abs(data.monthStats.expenses))}</span>
                </Card>
                <Card style={{ padding: "1rem", textAlign: "center" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", display: "block", marginBottom: "0.25rem" }}>Saldo Final Mes</span>
                  <span style={{ fontSize: "1.1rem", fontWeight: "bold", color: "var(--color-primary)" }}>{formatCurrency(data.monthStats.finalBalance)}</span>
                </Card>
              </div>
            </div>
          )}

          {/* TAB: MOVIMIENTOS */}
          {activeTab === "movements" && data && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Filters */}
              <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
                {[
                  { id: "all", label: "Todo" },
                  { id: "ingresos", label: "Ingresos" },
                  { id: "gastos", label: "Gastos" },
                  { id: "cierres", label: "Cierres" }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFilterType(f.id)}
                    style={{
                      padding: "0.5rem 1rem",
                      borderRadius: "99px",
                      border: filterType === f.id ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
                      backgroundColor: filterType === f.id ? "var(--color-primary-light)" : "var(--color-surface)",
                      color: filterType === f.id ? "var(--color-primary)" : "var(--color-text)",
                      fontSize: "0.875rem",
                      cursor: "pointer",
                      whiteSpace: "nowrap"
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {data.movements.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-secondary)" }}>
                    No hay movimientos registrados
                  </div>
                ) : (
                  data.movements.map(mov => (
                    <Card key={mov._id} style={{ padding: "1rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                      <div style={{ 
                        width: "40px", height: "40px", 
                        borderRadius: "50%", 
                        backgroundColor: mov.type === "income" ? "var(--color-success-bg)" : "var(--color-danger-bg)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: mov.type === "income" ? "var(--color-success)" : "var(--color-danger)"
                      }}>
                        {mov.category === "cierre_mes" ? <Lock size={20} /> : mov.type === "income" ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: "1rem", fontWeight: 600 }}>{mov.description}</h4>
                        <span style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>
                          {new Date(mov.date).toLocaleDateString()} • {mov.category}
                        </span>
                      </div>
                      <div style={{ fontWeight: "bold", fontSize: "1rem", color: mov.amount >= 0 ? "var(--color-success)" : "var(--color-danger)" }}>
                        {mov.amount >= 0 ? "+" : ""}{formatCurrency(mov.amount)}
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB: CIERRES */}
          {activeTab === "closings" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {/* Current Month Status Card */}
              <Card>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 600 }}>{monthName} {year}</h3>
                  <Badge variant={isCurrentMonthClosed ? "success" : "warning"}>
                    {isCurrentMonthClosed ? "CERRADO 🔒" : "ABIERTO 🟡"}
                  </Badge>
                </div>
                
                {isCurrentMonthClosed ? (
                  <div>
                    <p style={{ color: "var(--color-text-secondary)", marginBottom: "1rem" }}>
                      Este mes ya ha sido cerrado y su saldo transferido al Banco.
                    </p>
                    <Button variant="outline" onClick={handleOpenMonth} style={{ width: "100%", borderColor: "var(--color-warning)", color: "var(--color-warning)" }}>
                      <Unlock size={18} style={{ marginRight: "0.5rem" }} /> Desbloquear Mes
                    </Button>
                  </div>
                ) : (
                  <div>
                    <p style={{ color: "var(--color-text-secondary)", marginBottom: "1rem" }}>
                      Cierra este mes para transferir tus ganancias netas al Banco.
                    </p>
                    <Button variant="primary" onClick={handleCloseMonth} style={{ width: "100%" }}>
                      <Lock size={18} style={{ marginRight: "0.5rem" }} /> Cerrar Mes
                    </Button>
                  </div>
                )}
              </Card>

              {/* History List */}
              <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>Historial de Cierres</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {data?.closings?.map(closing => (
                  <Card key={closing._id} style={{ padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <Lock size={20} className="text-success" />
                      <div>
                        <div style={{ fontWeight: 600 }}>{new Date(closing.year, closing.month - 1).toLocaleString('es-ES', { month: 'long' })} {closing.year}</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>Cerrado el {new Date(closing.closedAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div style={{ fontWeight: "bold", color: "var(--color-success)" }}>
                      +{formatCurrency(closing.totalAmount)}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
