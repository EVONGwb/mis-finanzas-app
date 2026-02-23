import { useState, useEffect } from "react";
import { apiFetch } from "../../lib/api";
import { getToken } from "../../lib/auth";
import { Card, StatsCard } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Table, TableRow, TableCell } from "../../components/ui/Table";
import { Badge } from "../../components/ui/Badge";
import { Skeleton } from "../../components/ui/Skeleton";
import { 
  Clock, 
  DollarSign, 
  Briefcase, 
  Calendar, 
  Plus, 
  Trash2, 
  Edit2, 
  TrendingUp, 
  BarChart2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function DeliveriesDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [entries, setEntries] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingEntries, setLoadingEntries] = useState(true);
  
  // Filtros de fecha
  const [dateRange, setDateRange] = useState("month"); // 'today', 'week', 'month'
  const [customDate, setCustomDate] = useState(new Date());

  // Modal State
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  
  // Form State
  const [entryForm, setEntryForm] = useState({
    date: new Date().toISOString().split("T")[0],
    companyId: "",
    hours: "",
    hourlyRate: "",
    notes: ""
  });

  const [companyForm, setCompanyForm] = useState({
    id: null, // Para edición
    name: "",
    hourlyRateDefault: "",
    description: "",
    // Deducciones por defecto
    deductions: {
      commonContingencies: 4.85,
      unemploymentAccident: 1.65,
      irpf: 20.0,
      other: 0,
      otherConcept: ""
    },
    limitRule: {
      enabled: false,
      amount: 1600
    }
  });

  // Cargar datos iniciales (empresas)
  useEffect(() => {
    fetchCompanies();
  }, []);

  // Cargar estadísticas y entradas cuando cambian los filtros
  useEffect(() => {
    fetchData();
  }, [dateRange, customDate]);

  const getDateFilter = () => {
    const now = new Date(customDate);
    let from, to;

    if (dateRange === "today") {
      from = new Date(now.setHours(0,0,0,0)).toISOString();
      to = new Date(now.setHours(23,59,59,999)).toISOString();
    } else if (dateRange === "week") {
      const day = now.getDay() || 7; // 1 (Mon) - 7 (Sun)
      if (day !== 1) now.setHours(-24 * (day - 1));
      from = new Date(now.setHours(0,0,0,0)).toISOString();
      const endOfWeek = new Date(now);
      endOfWeek.setDate(now.getDate() + 6);
      to = new Date(endOfWeek.setHours(23,59,59,999)).toISOString();
    } else { // month
      from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
    }
    return { from, to };
  };

  const fetchData = async () => {
    setLoading(true);
    setLoadingEntries(true);
    try {
      const { from, to } = getDateFilter();
      const token = getToken();

      // Parallel fetch
      const [statsRes, entriesRes] = await Promise.all([
        apiFetch(`/work-entries/stats?from=${from}&to=${to}`, { token }),
        apiFetch(`/work-entries?from=${from}&to=${to}`, { token })
      ]);

      setStats(statsRes.data);
      setEntries(entriesRes.data);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
      setLoadingEntries(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await apiFetch("/companies", { token: getToken() });
      setCompanies(res.data);
    } catch (error) {
      console.error("Error loading companies:", error);
    }
  };

  const handleCreateEntry = async (e) => {
    e.preventDefault();
    try {
      await apiFetch("/work-entries", {
        method: "POST",
        token: getToken(),
        body: entryForm
      });
      setIsEntryModalOpen(false);
      setEntryForm({
        date: new Date().toISOString().split("T")[0],
        companyId: "",
        hours: "",
        hourlyRate: "",
        notes: ""
      });
      fetchData();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleSaveCompany = async (e) => {
    e.preventDefault();
    try {
      const isEdit = !!companyForm.id;
      const url = isEdit ? `/companies/${companyForm.id}` : "/companies";
      const method = isEdit ? "PATCH" : "POST";

      const payload = {
        name: companyForm.name,
        hourlyRateDefault: companyForm.hourlyRateDefault,
        description: companyForm.description,
        deductions: companyForm.deductions,
        limitRule: companyForm.limitRule
      };

      await apiFetch(url, {
        method,
        token: getToken(),
        body: payload
      });

      setIsCompanyModalOpen(false);
      resetCompanyForm();
      fetchCompanies();
    } catch (error) {
      alert(error.message);
    }
  };

  const resetCompanyForm = () => {
    setCompanyForm({
      id: null,
      name: "",
      hourlyRateDefault: "",
      description: "",
      deductions: {
        commonContingencies: 4.85,
        unemploymentAccident: 1.65,
        irpf: 20.0,
        other: 0,
        otherConcept: ""
      },
      limitRule: {
        enabled: false,
        amount: 1600
      }
    });
  };

  const handleEditCompany = (company) => {
    setCompanyForm({
      id: company._id,
      name: company.name,
      hourlyRateDefault: company.hourlyRateDefault,
      description: company.description || "",
      deductions: {
        commonContingencies: company.deductions?.commonContingencies ?? 4.85,
        unemploymentAccident: company.deductions?.unemploymentAccident ?? 1.65,
        irpf: company.deductions?.irpf ?? 20.0,
        other: company.deductions?.other ?? 0,
        otherConcept: company.deductions?.otherConcept || ""
      },
      limitRule: {
        enabled: company.limitRule?.enabled ?? false,
        amount: company.limitRule?.amount ?? 1600
      }
    });
    setIsCompanyModalOpen(true);
  };

  const handleDeleteEntry = async (id) => {
    if (!window.confirm("¿Eliminar registro?")) return;
    try {
      await apiFetch(`/work-entries/${id}`, { method: "DELETE", token: getToken() });
      fetchData();
    } catch (error) {
      alert(error.message);
    }
  };

  // Helpers UI
  const formatDateLabel = () => {
    const d = new Date(customDate);
    if (dateRange === "today") return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    if (dateRange === "month") return d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    return "Esta Semana";
  };

  const changeDate = (direction) => {
    const newDate = new Date(customDate);
    if (dateRange === "today") newDate.setDate(newDate.getDate() + direction);
    else if (dateRange === "week") newDate.setDate(newDate.getDate() + (direction * 7));
    else newDate.setMonth(newDate.getMonth() + direction);
    setCustomDate(newDate);
  };

  const handleDeleteCompany = async (id) => {
    if (!window.confirm("¿Eliminar empresa? Se perderán las estadísticas asociadas si no están guardadas.")) return;
    try {
      await apiFetch(`/companies/${id}`, { method: "DELETE", token: getToken() });
      fetchCompanies();
    } catch (error) {
      alert(error.message);
    }
  };

  const getPayrollSummary = (company, totalEarnings) => {
    if (!company) return null;

    const limitEnabled = company.limitRule?.enabled || false;
    const limitAmount = company.limitRule?.amount || 0;
    
    // 1. Calcular tramos
    let tramoDeducible = totalEarnings;
    let excedenteLibre = 0;

    if (limitEnabled) {
      if (totalEarnings > limitAmount) {
        tramoDeducible = limitAmount;
        excedenteLibre = totalEarnings - limitAmount;
      } else {
        tramoDeducible = totalEarnings;
        excedenteLibre = 0;
      }
    }

    // 2. Calcular deducciones
    const ded = company.deductions || {};
    const dCC = (tramoDeducible * (ded.commonContingencies || 0)) / 100;
    const dDA = (tramoDeducible * (ded.unemploymentAccident || 0)) / 100;
    const dIRPF = (tramoDeducible * (ded.irpf || 0)) / 100;
    const dOther = (tramoDeducible * (ded.other || 0)) / 100;

    const totalDeducciones = dCC + dDA + dIRPF + dOther;
    
    // 3. Neto
    const netoNomina = tramoDeducible - totalDeducciones;
    const totalRealCobrado = netoNomina + excedenteLibre;

    return {
      tramoDeducible,
      excedenteLibre,
      deductions: {
        cc: dCC,
        da: dDA,
        irpf: dIRPF,
        other: dOther,
        total: totalDeducciones
      },
      netoNomina,
      totalRealCobrado
    };
  };

  const selectedCompanyStats = stats?.byCompany?.length === 1 ? stats.byCompany[0] : null;
  const companyForPayroll = selectedCompanyStats ? companies.find(c => c.name === selectedCompanyStats.companyName) : null;
  const payroll = companyForPayroll ? getPayrollSummary(companyForPayroll, selectedCompanyStats.totalEarnings) : null;

  return (
    <div className="animate-fade-in" style={{ paddingBottom: "5rem" }}>
      {/* Header & Filters */}
      <div style={{ 
        display: "flex", 
        flexDirection: "column", 
        gap: "1.5rem", 
        marginBottom: "2rem" 
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "1.875rem", fontWeight: "bold", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Briefcase className="text-primary" /> Registro de Horas
            </h1>
            <p style={{ color: "var(--color-text-secondary)" }}>Gestiona tus horas y ganancias por empresa</p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Button variant="outline" onClick={() => setIsCompanyModalOpen(true)}>
              Gestionar Empresas
            </Button>
            <Button onClick={() => setIsEntryModalOpen(true)}>
              <Plus size={18} style={{ marginRight: "0.5rem" }} /> Añadir Horas
            </Button>
          </div>
        </div>

        {/* Date Controls */}
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between", 
          backgroundColor: "var(--color-surface)", 
          padding: "0.5rem", 
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--color-border)",
          overflowX: "auto", // Allow scrolling if needed on very small screens
          flexWrap: "wrap",  // Wrap content on small screens
          gap: "0.5rem"
        }}>
          <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
            {["today", "week", "month"].map(range => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  backgroundColor: dateRange === range ? "var(--color-primary)" : "transparent",
                  color: dateRange === range ? "white" : "var(--color-text-secondary)",
                  cursor: "pointer",
                  fontWeight: 500,
                  fontSize: "0.875rem",
                  transition: "all 0.2s",
                  whiteSpace: "nowrap"
                }}
              >
                {range === "today" ? "Día" : range === "week" ? "Semana" : "Mes"}
              </button>
            ))}
          </div>

          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "0.5rem", 
            flexGrow: 1, 
            justifyContent: "flex-end", // Align to right on larger screens
            minWidth: "200px" // Ensure date has space
          }}>
            <button onClick={() => changeDate(-1)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text)", padding: "0.25rem" }}>
              <ChevronLeft size={20} />
            </button>
            <span style={{ 
              fontWeight: 600, 
              textAlign: "center", 
              textTransform: "capitalize",
              flexGrow: 1, // Let text take available space
              whiteSpace: "nowrap", // Prevent date wrapping awkwardly
              overflow: "hidden",
              textOverflow: "ellipsis"
            }}>
              {formatDateLabel()}
            </span>
            <button onClick={() => changeDate(1)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text)", padding: "0.25rem" }}>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      {loading ? (
        <div style={{ display: "grid", gap: "1.5rem", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", marginBottom: "2rem" }}>
          <Skeleton height="120px" />
          <Skeleton height="120px" />
          <Skeleton height="120px" />
          <Skeleton height="120px" />
        </div>
      ) : (
        <div style={{ display: "grid", gap: "1.5rem", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", marginBottom: "2rem" }}>
          <StatsCard 
            title="Ganancias Brutas" 
            value={`$${stats?.totalEarnings?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}`} 
            icon={DollarSign} 
            color="success" 
          />
          <StatsCard 
            title="Horas Trabajadas" 
            value={`${stats?.totalHours || 0} h`} 
            icon={Clock} 
            color="info" 
          />
          {payroll ? (
             <StatsCard 
              title="Neto Estimado" 
              value={`$${payroll.totalRealCobrado.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
              subtext={`Excedente: ${payroll.excedenteLibre.toFixed(2)}€`}
              icon={TrendingUp} 
              color="primary" 
            />
          ) : (
             <StatsCard 
              title="Promedio Diario" 
              value={`$${stats?.dailyAverage?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}`} 
              icon={TrendingUp} 
              color="warning" 
            />
          )}
         
          <StatsCard 
            title="Top Empresa" 
            value={stats?.topCompany?.companyName || "-"} 
            subtext={stats?.topCompany ? `$${stats.topCompany.totalEarnings.toLocaleString()}` : "Sin datos"}
            icon={Briefcase} 
            color="primary" 
          />
        </div>
      )}

      {/* Nómina Detallada (Solo si hay una empresa seleccionada o dominante y datos de nómina) */}
      {payroll && companyForPayroll && (
        <div style={{ marginBottom: "2rem" }}>
          <Card title={`Resumen de Nómina: ${companyForPayroll.name}`}>
             <div style={{ display: "grid", gap: "1.5rem", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))" }}>
               {/* Columna Izquierda: Datos Base */}
               <div style={{ padding: "1rem", backgroundColor: "var(--color-surface)", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}>
                 <h4 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "1rem", textTransform: "uppercase" }}>Base de Cálculo</h4>
                 <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                   <span>Bruto Total:</span>
                   <span style={{ fontWeight: 600 }}>{selectedCompanyStats.totalEarnings.toLocaleString()} €</span>
                 </div>
                 <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                   <span>Límite Aplicado:</span>
                   <span>{companyForPayroll.limitRule?.enabled ? `${companyForPayroll.limitRule.amount} €` : "No activo"}</span>
                 </div>
                 <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", color: "var(--color-text-secondary)" }}>
                   <span>Tramo Sujeto a Deducción:</span>
                   <span>{payroll.tramoDeducible.toLocaleString()} €</span>
                 </div>
                 <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem", color: "var(--color-success)", fontWeight: 700 }}>
                   <span>Excedente Libre (Limpio):</span>
                   <span>{payroll.excedenteLibre.toLocaleString()} €</span>
                 </div>
               </div>

               {/* Columna Centro: Deducciones */}
               <div style={{ padding: "1rem", backgroundColor: "var(--color-surface)", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}>
                 <h4 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-danger)", marginBottom: "1rem", textTransform: "uppercase" }}>Deducciones</h4>
                 <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                   <span>Contingencias Comunes ({companyForPayroll.deductions?.commonContingencies}%):</span>
                   <span style={{ color: "var(--color-danger)" }}>-{payroll.deductions.cc.toFixed(2)} €</span>
                 </div>
                 <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                   <span>Desempleo / Acc. ({companyForPayroll.deductions?.unemploymentAccident}%):</span>
                   <span style={{ color: "var(--color-danger)" }}>-{payroll.deductions.da.toFixed(2)} €</span>
                 </div>
                 <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                   <span>IRPF ({companyForPayroll.deductions?.irpf}%):</span>
                   <span style={{ color: "var(--color-danger)" }}>-{payroll.deductions.irpf.toFixed(2)} €</span>
                 </div>
                 {payroll.deductions.other > 0 && (
                   <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                     <span>Otras ({companyForPayroll.deductions?.other}%):</span>
                     <span style={{ color: "var(--color-danger)" }}>-{payroll.deductions.other.toFixed(2)} €</span>
                   </div>
                 )}
                 <div style={{ borderTop: "1px dashed var(--color-border)", margin: "0.5rem 0" }} />
                 <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600 }}>
                   <span>Total Deducciones:</span>
                   <span style={{ color: "var(--color-danger)" }}>-{payroll.deductions.total.toFixed(2)} €</span>
                 </div>
               </div>

               {/* Columna Derecha: Resultado */}
               <div style={{ padding: "1rem", backgroundColor: "var(--color-success-bg)", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-success)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                 <h4 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-success)", marginBottom: "1rem", textTransform: "uppercase", textAlign: "center" }}>A Percibir</h4>
                 <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                   <span>Neto de Nómina:</span>
                   <span>{payroll.netoNomina.toLocaleString()} €</span>
                 </div>
                 <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                   <span>+ Excedente Libre:</span>
                   <span>{payroll.excedenteLibre.toLocaleString()} €</span>
                 </div>
                 <div style={{ borderTop: "2px solid var(--color-success)", margin: "1rem 0" }} />
                 <div style={{ textAlign: "center" }}>
                   <div style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>TOTAL REAL A COBRAR</div>
                   <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--color-success)" }}>
                     {payroll.totalRealCobrado.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                   </div>
                 </div>
               </div>
             </div>
          </Card>
        </div>
      )}

      {/* Main Content: List & Chart placeholder */}
      <div style={{ display: "grid", gap: "2rem", gridTemplateColumns: "1fr" }}>
        <Card title="Historial de Entregas">
          {loadingEntries ? (
            <p style={{ padding: "1rem", color: "var(--color-text-secondary)" }}>Cargando registros...</p>
          ) : entries.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
              <div style={{ 
                backgroundColor: "var(--color-surface-hover)", 
                width: "64px", height: "64px", borderRadius: "50%", 
                display: "flex", alignItems: "center", justifyContent: "center", 
                margin: "0 auto 1rem auto", color: "var(--color-text-secondary)"
              }}>
                <Briefcase size={32} />
              </div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.5rem" }}>No hay registros</h3>
              <p style={{ color: "var(--color-text-secondary)", marginBottom: "1.5rem" }}>
                Añade tus horas trabajadas para ver estadísticas.
              </p>
              <Button onClick={() => setIsEntryModalOpen(true)}>Comenzar</Button>
            </div>
          ) : (
            <Table headers={["Fecha", "Empresa", "Horas", "Precio/h", "Total", "Acciones"]}>
              {entries.map(entry => (
                <TableRow key={entry._id}>
                  <TableCell>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontWeight: 500 }}>
                        {new Date(entry.date).toLocaleDateString()}
                      </span>
                      {entry.notes && (
                        <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                          {entry.notes}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral">{entry.company?.name || "Eliminada"}</Badge>
                  </TableCell>
                  <TableCell>{entry.hours} h</TableCell>
                  <TableCell>${entry.hourlyRate}</TableCell>
                  <TableCell>
                    <span style={{ fontWeight: "bold", color: "var(--color-success)" }}>
                      ${entry.total.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      style={{ color: "var(--color-danger)" }}
                      onClick={() => handleDeleteEntry(entry._id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </Table>
          )}
        </Card>
      </div>

      {/* Modal: Add Work Entry */}
      <Modal 
        isOpen={isEntryModalOpen} 
        onClose={() => setIsEntryModalOpen(false)} 
        title="Registrar Horas"
      >
        <form onSubmit={handleCreateEntry} style={{ display: "grid", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: 500 }}>Empresa</label>
            <select
              required
              value={entryForm.companyId}
              onChange={(e) => {
                const company = companies.find(c => c._id === e.target.value);
                setEntryForm({
                  ...entryForm,
                  companyId: e.target.value,
                  hourlyRate: company ? company.hourlyRateDefault : ""
                });
              }}
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-surface)",
                color: "var(--color-text)"
              }}
            >
              <option value="">Selecciona una empresa...</option>
              {companies.map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
            {companies.length === 0 && (
              <p style={{ fontSize: "0.75rem", color: "var(--color-warning)", marginTop: "0.25rem" }}>
                Primero debes crear una empresa.
              </p>
            )}
          </div>

          <Input 
            label="Fecha" 
            type="date" 
            required 
            value={entryForm.date}
            onChange={(e) => setEntryForm({...entryForm, date: e.target.value})}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <Input 
              label="Horas" 
              type="number" 
              step="0.1" 
              required 
              placeholder="Ej: 7.5"
              value={entryForm.hours}
              onChange={(e) => setEntryForm({...entryForm, hours: e.target.value})}
            />
            <Input 
              label="Precio / Hora" 
              type="number" 
              step="0.01" 
              required 
              value={entryForm.hourlyRate}
              onChange={(e) => setEntryForm({...entryForm, hourlyRate: e.target.value})}
            />
          </div>

          <Input 
            label="Notas (Opcional)" 
            placeholder="Turno extra, festivo..."
            value={entryForm.notes}
            onChange={(e) => setEntryForm({...entryForm, notes: e.target.value})}
          />

          <div style={{ marginTop: "1rem", padding: "1rem", backgroundColor: "var(--color-surface-hover)", borderRadius: "var(--radius-md)" }}>
            <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>Total Estimado</p>
            <p style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--color-success)" }}>
              ${((parseFloat(entryForm.hours) || 0) * (parseFloat(entryForm.hourlyRate) || 0)).toFixed(2)}
            </p>
          </div>

          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            <Button type="button" variant="ghost" onClick={() => setIsEntryModalOpen(false)} style={{ flex: 1 }}>
              Cancelar
            </Button>
            <Button type="submit" style={{ flex: 1 }} disabled={companies.length === 0}>
              Guardar Registro
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Create/Edit Company */}
      <Modal 
        isOpen={isCompanyModalOpen} 
        onClose={() => {
          setIsCompanyModalOpen(false);
          resetCompanyForm();
        }} 
        title={companyForm.id ? "Editar Empresa" : "Nueva Empresa"}
      >
        <form onSubmit={handleSaveCompany} style={{ display: "grid", gap: "1rem" }}>
          <Input 
            label="Nombre de la Empresa" 
            required 
            placeholder="Ej: Uber, Glovo..."
            value={companyForm.name}
            onChange={(e) => setCompanyForm({...companyForm, name: e.target.value})}
          />
          <Input 
            label="Precio Hora Estándar ($)" 
            type="number" 
            step="0.01" 
            required 
            placeholder="Ej: 15.50"
            value={companyForm.hourlyRateDefault}
            onChange={(e) => setCompanyForm({...companyForm, hourlyRateDefault: e.target.value})}
          />
          <Input 
            label="Descripción (Opcional)" 
            placeholder="Notas sobre pagos, condiciones..."
            value={companyForm.description}
            onChange={(e) => setCompanyForm({...companyForm, description: e.target.value})}
          />

          <hr style={{ border: "0", borderTop: "1px solid var(--color-border)", margin: "0.5rem 0" }} />

          {/* Sección de Deducciones */}
          <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--color-text)" }}>Deducciones de Nómina (%)</h3>
          <p style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginTop: "-0.5rem", marginBottom: "0.5rem" }}>
            Configura los porcentajes que se descontarán de tu salario bruto.
          </p>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <Input 
              label="Contingencias Comunes (%)" 
              type="number" step="0.01" min="0" max="100"
              value={companyForm.deductions?.commonContingencies || 0}
              onChange={(e) => setCompanyForm({
                ...companyForm, 
                deductions: { ...companyForm.deductions, commonContingencies: parseFloat(e.target.value) || 0 }
              })}
            />
            <Input 
              label="Desempleo / Accidentes (%)" 
              type="number" step="0.01" min="0" max="100"
              value={companyForm.deductions?.unemploymentAccident || 0}
              onChange={(e) => setCompanyForm({
                ...companyForm, 
                deductions: { ...companyForm.deductions, unemploymentAccident: parseFloat(e.target.value) || 0 }
              })}
            />
            <Input 
              label="IRPF (%)" 
              type="number" step="0.01" min="0" max="100"
              value={companyForm.deductions?.irpf || 0}
              onChange={(e) => setCompanyForm({
                ...companyForm, 
                deductions: { ...companyForm.deductions, irpf: parseFloat(e.target.value) || 0 }
              })}
            />
             <Input 
              label="Otras Deducciones (%)" 
              type="number" step="0.01" min="0" max="100"
              value={companyForm.deductions?.other || 0}
              onChange={(e) => setCompanyForm({
                ...companyForm, 
                deductions: { ...companyForm.deductions, other: parseFloat(e.target.value) || 0 }
              })}
            />
          </div>

          <hr style={{ border: "0", borderTop: "1px solid var(--color-border)", margin: "0.5rem 0" }} />

          {/* Sección de Límite / Excedente */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--color-text)" }}>Regla del Límite</h3>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.875rem" }}>
              <input 
                type="checkbox"
                checked={companyForm.limitRule?.enabled || false}
                onChange={(e) => setCompanyForm({
                  ...companyForm,
                  limitRule: { ...companyForm.limitRule, enabled: e.target.checked }
                })}
              />
              Activar Límite
            </label>
          </div>
          
          {companyForm.limitRule?.enabled && (
            <div style={{ backgroundColor: "var(--color-surface-hover)", padding: "1rem", borderRadius: "var(--radius-sm)" }}>
               <Input 
                label="Límite Bruto Sujeto a Deducción (€)" 
                type="number" step="0.01"
                value={companyForm.limitRule?.amount || 1600}
                onChange={(e) => setCompanyForm({
                  ...companyForm,
                  limitRule: { ...companyForm.limitRule, amount: parseFloat(e.target.value) || 0 }
                })}
              />
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginTop: "0.5rem" }}>
                Todo lo que ganes por encima de {companyForm.limitRule?.amount || 0}€ será considerado excedente libre (dinero limpio sin deducciones).
              </p>
            </div>
          )}

          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            <Button type="button" variant="ghost" onClick={() => { setIsCompanyModalOpen(false); resetCompanyForm(); }} style={{ flex: 1 }}>
              Cancelar
            </Button>
            <Button type="submit" style={{ flex: 1 }}>
              {companyForm.id ? "Guardar Cambios" : "Crear Empresa"}
            </Button>
          </div>
        </form>
        
        {/* Lista rápida de empresas existentes para editar/borrar */}
        {companies.length > 0 && !companyForm.id && (
          <div style={{ marginTop: "2rem", paddingTop: "1rem", borderTop: "1px solid var(--color-border)" }}>
            <h4 style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "1rem" }}>Empresas Existentes</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {companies.map(c => (
                <div key={c._id} style={{ 
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "0.75rem", backgroundColor: "var(--color-surface)", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)"
                }}>
                  <div style={{ cursor: "pointer", flex: 1 }} onClick={() => handleEditCompany(c)}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontWeight: 500 }}>{c.name}</span>
                      {c.limitRule?.enabled && (
                        <Badge variant="success" style={{ fontSize: "0.6rem", padding: "2px 6px" }}>Límite {c.limitRule.amount}€</Badge>
                      )}
                    </div>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                      ${c.hourlyRateDefault}/h • Deducciones: {
                        (c.deductions?.commonContingencies || 0) + 
                        (c.deductions?.unemploymentAccident || 0) + 
                        (c.deductions?.irpf || 0)
                      }%
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                     <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => handleEditCompany(c)}
                      title="Editar empresa"
                    >
                      <Edit2 size={16} />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      style={{ color: "var(--color-danger)" }}
                      onClick={() => handleDeleteCompany(c._id)}
                      title="Eliminar empresa"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
