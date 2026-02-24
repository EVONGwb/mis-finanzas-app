import { useState, useEffect, useMemo } from "react";
import { apiFetch } from "../../lib/api";
import { getToken } from "../../lib/auth";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { 
  Briefcase, 
  Calendar as CalendarIcon, 
  Plus, 
  Trash2, 
  Edit2, 
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
  
  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date()); // For month navigation
  const [selectedDate, setSelectedDate] = useState(new Date()); // Selected specific day

  // Modal State
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  
  // Form State
  const [entryForm, setEntryForm] = useState({
    companyId: "",
    hours: "",
    hourlyRate: "",
    notes: ""
  });

  const [companyForm, setCompanyForm] = useState({
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

  // Initial Load
  useEffect(() => {
    fetchCompanies();
  }, []);

  // Fetch Data when Month Changes
  useEffect(() => {
    fetchData();
  }, [currentDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Always fetch for the full month of currentDate
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const from = new Date(year, month, 1).toISOString();
      const to = new Date(year, month + 1, 0, 23, 59, 59, 999).toISOString();
      
      const token = getToken();

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
        body: {
          ...entryForm,
          date: selectedDate.toISOString().split("T")[0] // Use selectedDate
        }
      });
      
      // Reset form but keep company if desired? For now reset all
      setEntryForm({
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

  const handleDeleteEntry = async (id) => {
    if (!window.confirm("¿Eliminar registro?")) return;
    try {
      await apiFetch(`/work-entries/${id}`, { method: "DELETE", token: getToken() });
      fetchData();
    } catch (error) {
      alert(error.message);
    }
  };

  // --- Company Management Handlers (Same as before) ---
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

      await apiFetch(url, { method, token: getToken(), body: payload });

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

  const handleDeleteCompany = async (id) => {
    if (!window.confirm("¿Eliminar empresa?")) return;
    try {
      await apiFetch(`/companies/${id}`, { method: "DELETE", token: getToken() });
      fetchCompanies();
    } catch (error) {
      alert(error.message);
    }
  };

  // --- Payroll Helper (Same as before) ---
  const getPayrollSummary = (company, totalEarnings) => {
    if (!company) return null;
    const limitEnabled = company.limitRule?.enabled || false;
    const limitAmount = company.limitRule?.amount || 0;
    
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

    const ded = company.deductions || {};
    const dCC = (tramoDeducible * (ded.commonContingencies || 0)) / 100;
    const dDA = (tramoDeducible * (ded.unemploymentAccident || 0)) / 100;
    const dIRPF = (tramoDeducible * (ded.irpf || 0)) / 100;
    const dOther = (tramoDeducible * (ded.other || 0)) / 100;
    const totalDeducciones = dCC + dDA + dIRPF + dOther;
    const netoNomina = tramoDeducible - totalDeducciones;
    const totalRealCobrado = netoNomina + excedenteLibre;

    return {
      tramoDeducible,
      excedenteLibre,
      deductions: { cc: dCC, da: dDA, irpf: dIRPF, other: dOther, total: totalDeducciones },
      netoNomina,
      totalRealCobrado
    };
  };

  // --- Derived Data for UI ---
  const selectedCompanyStats = stats?.byCompany?.length === 1 ? stats.byCompany[0] : null;
  const companyForPayroll = selectedCompanyStats ? companies.find(c => c.name === selectedCompanyStats.companyName) : null;
  const payroll = companyForPayroll ? getPayrollSummary(companyForPayroll, selectedCompanyStats.totalEarnings) : null;

  // Filter entries for the selected date
  const selectedDateEntries = useMemo(() => {
    const dateStr = selectedDate.toISOString().split("T")[0];
    return entries.filter(e => e.date.startsWith(dateStr));
  }, [entries, selectedDate]);

  // Calendar Generation
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days = [];
    
    // Fill previous month days
    const startPadding = (firstDay.getDay() + 6) % 7; // Mon=0
    for (let i = 0; i < startPadding; i++) {
      days.push(null);
    }
    
    // Fill current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  }, [currentDate]);

  const hasEntryOnDate = (date) => {
    if (!date) return false;
    const dateStr = date.toISOString().split("T")[0];
    return entries.some(e => e.date.startsWith(dateStr));
  };

  const getDayTotal = (date) => {
    if (!date) return 0;
    const dateStr = date.toISOString().split("T")[0];
    return entries
      .filter(e => e.date.startsWith(dateStr))
      .reduce((sum, e) => sum + (e.total || 0), 0);
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: "5rem", maxWidth: "1200px", margin: "0 auto" }}>
      
      {/* 1. Header & Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Briefcase className="text-primary" size={24} /> 
            Ingresos & Horas
          </h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>
            {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase()}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Button variant="outline" size="sm" onClick={() => setIsCompanyModalOpen(true)}>
            Empresas
          </Button>
          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", backgroundColor: "var(--color-surface)", borderRadius: "var(--radius-md)", padding: "0.25rem", border: "1px solid var(--color-border)" }}>
             <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text)", padding: "0.25rem" }}>
              <ChevronLeft size={18} />
            </button>
            <span style={{ fontSize: "0.875rem", fontWeight: 600, minWidth: "80px", textAlign: "center" }}>
              {currentDate.toLocaleDateString('es-ES', { month: 'short' })}
            </span>
            <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text)", padding: "0.25rem" }}>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Minimal Summary Row (Space Saving) */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        padding: "0.75rem 0.5rem", 
        marginBottom: "1rem",
        backgroundColor: "var(--color-surface)",
        borderBottom: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        gap: "0.5rem"
      }}>
        <div style={{ textAlign: "center", flex: 1 }}>
          <span style={{ fontSize: "0.7rem", color: "var(--color-text-secondary)", display: "block", textTransform: "uppercase" }}>Ganancias</span>
          <span style={{ fontSize: "1rem", fontWeight: "bold", color: "var(--color-success)" }}>
            ${stats?.totalEarnings?.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) || "0"}
          </span>
        </div>
        
        <div style={{ width: "1px", height: "24px", backgroundColor: "var(--color-border)" }}></div>

        <div style={{ textAlign: "center", flex: 1 }}>
          <span style={{ fontSize: "0.7rem", color: "var(--color-text-secondary)", display: "block", textTransform: "uppercase" }}>Horas</span>
          <span style={{ fontSize: "1rem", fontWeight: "bold", color: "var(--color-info)" }}>
            {stats?.totalHours || 0}h
          </span>
        </div>

        <div style={{ width: "1px", height: "24px", backgroundColor: "var(--color-border)" }}></div>

        <div style={{ textAlign: "center", flex: 1 }}>
          <span style={{ fontSize: "0.7rem", color: "var(--color-text-secondary)", display: "block", textTransform: "uppercase" }}>Promedio</span>
          <span style={{ fontSize: "1rem", fontWeight: "bold", color: "var(--color-warning)" }}>
            ${stats?.dailyAverage?.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) || "0"}
          </span>
        </div>

        {payroll && (
          <>
            <div style={{ width: "1px", height: "24px", backgroundColor: "var(--color-border)" }}></div>
            <div style={{ textAlign: "center", flex: 1 }}>
              <span style={{ fontSize: "0.7rem", color: "var(--color-text-secondary)", display: "block", textTransform: "uppercase" }}>Neto</span>
              <span style={{ fontSize: "1rem", fontWeight: "bold", color: "var(--color-primary)" }}>
                ${payroll.totalRealCobrado.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
          </>
        )}
      </div>

      {/* 3. Main Content Grid: Calendar Only */}
      <div style={{ 
        paddingBottom: "2rem"
      }}>
        
        {/* Interactive Calendar (Full Width) */}
        <div style={{ 
          backgroundColor: "var(--color-surface)", 
          padding: "0.75rem", 
          borderRadius: "var(--radius-lg)", 
          border: "1px solid var(--color-border)", 
          boxShadow: "var(--shadow-sm)"
        }}>
          <h3 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <CalendarIcon size={16} /> Calendario
          </h3>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", textAlign: "center", marginBottom: "0.25rem" }}>
            {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
              <div key={i} style={{ fontSize: "0.65rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>{d}</div>
            ))}
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
            {calendarDays.map((day, idx) => {
              if (!day) return <div key={idx} />;
              
              const isSelected = day.toDateString() === selectedDate.toDateString();
              const isToday = day.toDateString() === new Date().toDateString();
              const hasData = hasEntryOnDate(day);
              const dayTotal = getDayTotal(day);

              return (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedDate(day);
                    setIsDetailsModalOpen(true);
                  }}
                  style={{
                    aspectRatio: "1",
                    borderRadius: "var(--radius-sm)",
                    border: isSelected ? "1.5px solid var(--color-primary)" : "1px solid transparent",
                    backgroundColor: isSelected ? "var(--color-primary-light)" : "var(--color-background)",
                    color: isSelected ? "var(--color-primary)" : "var(--color-text)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    position: "relative",
                    transition: "all 0.1s",
                    padding: "0.1rem"
                  }}
                >
                  <span style={{ fontSize: "0.75rem", fontWeight: isToday ? "bold" : "normal" }}>
                    {day.getDate()}
                  </span>
                  {hasData && (
                    <div style={{ marginTop: "0px", fontSize: "0.5rem", fontWeight: 600, color: "var(--color-success)", lineHeight: 1 }}>
                      ${Math.round(dayTotal)}
                    </div>
                  )}
                  {isToday && !isSelected && (
                    <div style={{ position: "absolute", bottom: "2px", width: "3px", height: "3px", borderRadius: "50%", backgroundColor: "var(--color-primary)" }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Details Modal */}
      <Modal 
        isOpen={isDetailsModalOpen} 
        onClose={() => setIsDetailsModalOpen(false)} 
        title={selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          
          {/* List of Entries for Selected Date */}
          {selectedDateEntries.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
               {selectedDateEntries.map(entry => (
                 <div key={entry._id} style={{ 
                   display: "flex", justifyContent: "space-between", alignItems: "center", 
                   padding: "1rem", backgroundColor: "var(--color-surface)", 
                   borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)"
                 }}>
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>{entry.company?.name || "Empresa"}</div>
                      <div style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
                        {entry.hours}h × ${entry.hourlyRate}/h
                      </div>
                      {entry.notes && <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginTop: "0.25rem" }}>"{entry.notes}"</div>}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: "bold", color: "var(--color-success)", fontSize: "1.125rem" }}>
                        ${entry.total.toLocaleString()}
                      </div>
                      <button 
                        onClick={() => handleDeleteEntry(entry._id)}
                        style={{ background: "none", border: "none", color: "var(--color-danger)", cursor: "pointer", fontSize: "0.75rem", marginTop: "0.25rem", textDecoration: "underline" }}
                      >
                        Eliminar
                      </button>
                    </div>
                 </div>
               ))}
            </div>
          )}

          {/* Add Entry Form */}
          <div style={{ 
            backgroundColor: "var(--color-surface)", 
            borderRadius: "var(--radius-md)", 
            padding: "0", 
          }}>
             <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>
               {selectedDateEntries.length > 0 ? "Añadir otro registro" : "Registrar actividad"}
             </h3>
             <form onSubmit={handleCreateEntry} style={{ display: "grid", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>EMPRESA</label>
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
                      width: "100%", padding: "0.75rem", borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--color-border)", backgroundColor: "var(--color-background)", color: "var(--color-text)"
                    }}
                  >
                    <option value="">Seleccionar...</option>
                    {companies.map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <Input 
                    label="HORAS" 
                    type="number" step="0.1" required 
                    placeholder="0.0"
                    value={entryForm.hours}
                    onChange={(e) => setEntryForm({...entryForm, hours: e.target.value})}
                  />
                  <Input 
                    label="PRECIO/H" 
                    type="number" step="0.01" required 
                    placeholder="0.00"
                    value={entryForm.hourlyRate}
                    onChange={(e) => setEntryForm({...entryForm, hourlyRate: e.target.value})}
                  />
                </div>

                <Input 
                  label="NOTAS" 
                  placeholder="Opcional..."
                  value={entryForm.notes}
                  onChange={(e) => setEntryForm({...entryForm, notes: e.target.value})}
                />

                <Button type="submit" disabled={companies.length === 0 || !entryForm.companyId || !entryForm.hours} style={{ width: "100%" }}>
                  <Plus size={16} style={{ marginRight: "0.5rem" }} /> 
                  Guardar
                </Button>
             </form>
          </div>
        </div>
      </Modal>

      {/* Modal: Create/Edit Company (Same as before) */}
      <Modal 
        isOpen={isCompanyModalOpen} 
        onClose={() => { setIsCompanyModalOpen(false); resetCompanyForm(); }} 
        title={companyForm.id ? "Editar Empresa" : "Nueva Empresa"}
      >
        <form onSubmit={handleSaveCompany} style={{ display: "grid", gap: "1rem" }}>
          {/* ... (Existing Company Form Content) ... */}
          <Input 
            label="Nombre de la Empresa" required placeholder="Ej: Uber..."
            value={companyForm.name} onChange={(e) => setCompanyForm({...companyForm, name: e.target.value})}
          />
          <Input 
            label="Precio Hora Estándar ($)" type="number" step="0.01" required placeholder="Ej: 15.50"
            value={companyForm.hourlyRateDefault} onChange={(e) => setCompanyForm({...companyForm, hourlyRateDefault: e.target.value})}
          />
          <Input 
            label="Descripción (Opcional)" placeholder="Notas..."
            value={companyForm.description} onChange={(e) => setCompanyForm({...companyForm, description: e.target.value})}
          />
          <hr style={{ border: "0", borderTop: "1px solid var(--color-border)", margin: "0.5rem 0" }} />
          <h3 style={{ fontSize: "1rem", fontWeight: 600 }}>Deducciones (%)</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <Input label="Contingencias" type="number" step="0.01" value={companyForm.deductions?.commonContingencies || 0} onChange={(e) => setCompanyForm({...companyForm, deductions: { ...companyForm.deductions, commonContingencies: parseFloat(e.target.value) || 0 }})} />
            <Input label="Desempleo" type="number" step="0.01" value={companyForm.deductions?.unemploymentAccident || 0} onChange={(e) => setCompanyForm({...companyForm, deductions: { ...companyForm.deductions, unemploymentAccident: parseFloat(e.target.value) || 0 }})} />
            <Input label="IRPF" type="number" step="0.01" value={companyForm.deductions?.irpf || 0} onChange={(e) => setCompanyForm({...companyForm, deductions: { ...companyForm.deductions, irpf: parseFloat(e.target.value) || 0 }})} />
            <Input label="Otras" type="number" step="0.01" value={companyForm.deductions?.other || 0} onChange={(e) => setCompanyForm({...companyForm, deductions: { ...companyForm.deductions, other: parseFloat(e.target.value) || 0 }})} />
          </div>
          <hr style={{ border: "0", borderTop: "1px solid var(--color-border)", margin: "0.5rem 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 600 }}>Límite Salarial</h3>
            <label style={{ display: "flex", gap: "0.5rem", fontSize: "0.875rem" }}>
              <input type="checkbox" checked={companyForm.limitRule?.enabled || false} onChange={(e) => setCompanyForm({...companyForm, limitRule: { ...companyForm.limitRule, enabled: e.target.checked }})} /> Activar
            </label>
          </div>
          {companyForm.limitRule?.enabled && (
             <Input label="Límite (€)" type="number" step="0.01" value={companyForm.limitRule?.amount || 1600} onChange={(e) => setCompanyForm({...companyForm, limitRule: { ...companyForm.limitRule, amount: parseFloat(e.target.value) || 0 }})} />
          )}
          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            <Button type="button" variant="ghost" onClick={() => { setIsCompanyModalOpen(false); resetCompanyForm(); }} style={{ flex: 1 }}>Cancelar</Button>
            <Button type="submit" style={{ flex: 1 }}>Guardar</Button>
          </div>
        </form>
        {companies.length > 0 && !companyForm.id && (
          <div style={{ marginTop: "2rem", paddingTop: "1rem", borderTop: "1px solid var(--color-border)" }}>
            <h4 style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "1rem" }}>Empresas Existentes</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {companies.map(c => (
                <div key={c._id} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem", backgroundColor: "var(--color-surface)", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}>
                  <span onClick={() => handleEditCompany(c)} style={{ cursor: "pointer", flex: 1 }}>{c.name}</span>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <Edit2 size={16} onClick={() => handleEditCompany(c)} style={{ cursor: "pointer" }} />
                    <Trash2 size={16} color="var(--color-danger)" onClick={() => handleDeleteCompany(c._id)} style={{ cursor: "pointer" }} />
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


