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
    name: "",
    hourlyRateDefault: "",
    description: ""
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

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    try {
      await apiFetch("/companies", {
        method: "POST",
        token: getToken(),
        body: companyForm
      });
      setIsCompanyModalOpen(false);
      setCompanyForm({ name: "", hourlyRateDefault: "", description: "" });
      fetchCompanies();
    } catch (error) {
      alert(error.message);
    }
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
              <Briefcase className="text-primary" /> Entregas
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
            title="Ganancias Totales" 
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
          <StatsCard 
            title="Promedio Diario" 
            value={`$${stats?.dailyAverage?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}`} 
            icon={TrendingUp} 
            color="warning" 
          />
          <StatsCard 
            title="Top Empresa" 
            value={stats?.topCompany?.companyName || "-"} 
            subtext={stats?.topCompany ? `$${stats.topCompany.totalEarnings.toLocaleString()}` : "Sin datos"}
            icon={Briefcase} 
            color="primary" 
          />
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

      {/* Modal: Create Company */}
      <Modal 
        isOpen={isCompanyModalOpen} 
        onClose={() => setIsCompanyModalOpen(false)} 
        title="Nueva Empresa"
      >
        <form onSubmit={handleCreateCompany} style={{ display: "grid", gap: "1rem" }}>
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
          
          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            <Button type="button" variant="ghost" onClick={() => setIsCompanyModalOpen(false)} style={{ flex: 1 }}>
              Cancelar
            </Button>
            <Button type="submit" style={{ flex: 1 }}>
              Crear Empresa
            </Button>
          </div>
        </form>
        
        {/* Lista rápida de empresas existentes para editar/borrar */}
        {companies.length > 0 && (
          <div style={{ marginTop: "2rem", paddingTop: "1rem", borderTop: "1px solid var(--color-border)" }}>
            <h4 style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "1rem" }}>Empresas Existentes</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {companies.map(c => (
                <div key={c._id} style={{ 
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "0.75rem", backgroundColor: "var(--color-surface)", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)"
                }}>
                  <div>
                    <span style={{ fontWeight: 500 }}>{c.name}</span>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginLeft: "0.5rem" }}>
                      ${c.hourlyRateDefault}/h
                    </span>
                  </div>
                  {/* Aquí se podría añadir botón de eliminar empresa */}
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
