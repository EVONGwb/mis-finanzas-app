import { useState, useEffect, useMemo, useCallback } from "react";
import { apiFetch } from "../../lib/api";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { useCurrency } from "../../context/CurrencyContext";
import { 
  Briefcase, 
  Calendar as CalendarIcon, 
  Plus, 
  Trash2, 
  Edit2, 
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  FileText,
  Lock,
  Unlock,
  AlertTriangle,
  Save
} from "lucide-react";

export default function DeliveriesDashboard() {
  const { formatCurrency } = useCurrency();
  const [stats, setStats] = useState(null);
  const [entries, setEntries] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date()); // For month navigation
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  }); // Selected specific day (UTC midnight)

  // Closing State
  const [isMonthClosed, setIsMonthClosed] = useState(false);
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState("");
  const [confirmClose, setConfirmClose] = useState(false);

  // Modal State
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isReceiptsModalOpen, setIsReceiptsModalOpen] = useState(false);

  const [receiptDrafts, setReceiptDrafts] = useState({});
  const [savingCompanyId, setSavingCompanyId] = useState(null);
  
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
    supplements: {
      benefits: 0,
      agreementBonus: 0,
      proratedPayments: 0,
      voluntaryImprovement: 0,
      other: 0
    },
    limitRule: {
      enabled: false,
      amount: 1600
    }
  });

  // Initial Load (removed to prevent duplicate with currentDate effect)

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Use UTC dates to match backend storage (which saves YYYY-MM-DD as UTC midnight)
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      
      // Start of month in UTC
      const from = new Date(Date.UTC(year, month, 1)).toISOString();
      // End of month in UTC (last millisecond of the month)
      const to = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999)).toISOString();

      const [statsRes, entriesRes, bankRes, receiptsRes] = await Promise.all([
        apiFetch(`/work-entries/stats?from=${from}&to=${to}&syncRates=1`),
        apiFetch(`/work-entries?from=${from}&to=${to}&syncRates=1`),
        apiFetch(`/bank?month=${month + 1}&year=${year}`), // Check if month is closed
        apiFetch(`/income-receipts?month=${month + 1}&year=${year}`)
      ]);

      setStats(statsRes.data);
      setEntries(entriesRes.data);
      setReceipts(receiptsRes.data || []);

      setReceiptDrafts((prev) => {
        const next = { ...prev };
        (receiptsRes.data || []).forEach((r) => {
          const cid = r.company?._id || r.company;
          if (!cid) return;
          const key = String(cid);
          if (next[key] === undefined) next[key] = String(r.amountReceived ?? "");
        });
        return next;
      });
      
      // Check closing status
      const isClosed = bankRes.data?.closings?.some(c => c.month === month + 1 && c.year === year);
      setIsMonthClosed(!!isClosed);

    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }, [currentDate]);


  const fetchCompanies = useCallback(async () => {
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const res = await apiFetch(`/companies?month=${month + 1}&year=${year}`);
      setCompanies(res.data);
    } catch (error) {
      console.error("Error loading companies:", error);
    }
  }, [currentDate]);

  useEffect(() => {
    fetchData();
    fetchCompanies();
  }, [fetchCompanies, fetchData]);

  const handleCreateEntry = async (e) => {
    e.preventDefault();
    try {
      await apiFetch("/work-entries", {
        method: "POST",
        body: {
          ...entryForm,
          hourlyRate: 0,
          date: selectedDate.toLocaleDateString('en-CA') // Force YYYY-MM-DD local
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

  const handleDelete = async (id) => {
    // Eliminar confirmación: if (!window.confirm("¿Eliminar registro?")) return;
    try {
      await apiFetch(`/work-entries/${id}`, { method: "DELETE" });
      fetchData();
    } catch (e) {
      alert(e.message);
    }
  };

  // --- Company Management Handlers (Same as before) ---
  const handleSaveCompany = async (e) => {
    e.preventDefault();
    try {
      const isEdit = !!companyForm.id;
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const url = isEdit 
        ? `/companies/${companyForm.id}?month=${month + 1}&year=${year}` 
        : `/companies`;
      const method = isEdit ? "PATCH" : "POST";

      const payload = {
        name: companyForm.name,
        hourlyRateDefault: companyForm.hourlyRateDefault,
        description: companyForm.description,
        deductions: companyForm.deductions,
        supplements: companyForm.supplements,
        limitRule: companyForm.limitRule
      };

      await apiFetch(url, { method, body: payload });

      setIsCompanyModalOpen(false);
      resetCompanyForm();
      fetchCompanies();
      fetchData(); // Recargar los registros para reflejar el nuevo precio/hora
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
      supplements: {
        benefits: 0,
        agreementBonus: 0,
        proratedPayments: 0,
        voluntaryImprovement: 0,
        other: 0
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
      supplements: {
        benefits: company.supplements?.benefits ?? 0,
        agreementBonus: company.supplements?.agreementBonus ?? 0,
        proratedPayments: company.supplements?.proratedPayments ?? 0,
        voluntaryImprovement: company.supplements?.voluntaryImprovement ?? 0,
        other: company.supplements?.other ?? 0
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
      await apiFetch(`/companies/${id}`, { method: "DELETE" });
      fetchCompanies();
    } catch (error) {
      alert(error.message);
    }
  };

  // --- Derived Data for UI ---
  // En modo "horas + cobros", no mostramos calculos de nomina/deducciones.
  const payroll = null;

    const ymdUTC = (d) => {
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, "0");
      const day = String(d.getUTCDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };

    // Filter entries for the selected date
    const selectedDateEntries = useMemo(() => {
      const selectedKey = ymdUTC(selectedDate);
      return entries.filter(e => ymdUTC(new Date(e.date)) === selectedKey);
    }, [entries, selectedDate]);

    // Calendar Generation
    const calendarDays = useMemo(() => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(Date.UTC(year, month, 1));
      const lastDay = new Date(Date.UTC(year, month + 1, 0));
      
      const days = [];
      
      // Fill previous month days (Lunes = 1, Domingo = 0 en getDay())
      // Queremos que la semana empiece en Lunes
      // getDay(): Dom=0, Lun=1, Mar=2...
      // Si es Lunes(1), padding=0. Si es Domingo(0), padding=6.
      let startPadding = firstDay.getDay() - 1;
      if (startPadding === -1) startPadding = 6;
      
      for (let i = 0; i < startPadding; i++) {
        days.push(null);
      }
      
      // Fill current month days
      for (let i = 1; i <= lastDay.getUTCDate(); i++) {
        days.push(new Date(Date.UTC(year, month, i)));
      }
      
      return days;
    }, [currentDate]);

    const hasEntryOnDate = (date) => {
      if (!date) return false;
      const key = ymdUTC(date);
      return entries.some(e => ymdUTC(new Date(e.date)) === key);
    };

    const getDayTotal = (date) => {
      if (!date) return 0;
      const key = ymdUTC(date);
      return entries
        .filter(e => ymdUTC(new Date(e.date)) === key)
        .reduce((sum, e) => sum + (e.hours || 0), 0);
    };

  const handleCloseMonth = async () => {
    try {
      await apiFetch("/bank/close", {
        method: "POST",
        body: { month: currentDate.getMonth() + 1, year: currentDate.getFullYear() }
      });
      setIsClosingModalOpen(false);
      fetchData(); // Refresh to update lock status
    } catch (e) {
      alert(e.message);
    }
  };

  const handleUnlockMonth = async (e) => {
    e.preventDefault();
    try {
      await apiFetch("/bank/open", {
        method: "POST",
        body: { 
          month: currentDate.getMonth() + 1, 
          year: currentDate.getFullYear(),
          password: unlockPassword
        }
      });
      setIsUnlockModalOpen(false);
      setUnlockPassword("");
      fetchData(); // Refresh
    } catch (e) {
      alert(e.message);
    }
  };

  const totalReceivedThisMonth = useMemo(() => {
    return (receipts || []).reduce((sum, r) => sum + Number(r.amountReceived || 0), 0);
  }, [receipts]);

  const avgHoursPerWorkedDay = useMemo(() => {
    const days = new Set();
    (entries || []).forEach((e) => {
      const d = new Date(e.date);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      days.add(key);
    });
    const workedDays = Math.max(1, days.size);
    const totalHours = Number(stats?.totalHours || 0);
    return totalHours / workedDays;
  }, [entries, stats]);

  const saveReceipt = async (companyId) => {
    setSavingCompanyId(companyId);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const raw = receiptDrafts[String(companyId)] ?? "0";
      await apiFetch("/income-receipts", {
        method: "POST",
        body: { companyId, year, month, amountReceived: Number(raw || 0) }
      });
      await fetchData();
    } catch (e) {
      alert(e.message || "Error al guardar el cobro");
    } finally {
      setSavingCompanyId(null);
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: "5rem", maxWidth: "1200px", margin: "0 auto" }}>
      {loading && (
        <div style={{ padding: "1rem", color: "var(--color-text-secondary)" }}>
          Cargando...
        </div>
      )}
      
      {/* 1. Header & Controls */}
      <div style={{ marginBottom: "1.5rem" }}>
        {/* Top Row: Title & Date Nav */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Briefcase className="text-primary" size={24} /> 
              Mis ingresos
            </h1>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>
              {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase()}
            </p>
          </div>
          
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

        {/* Bottom Row: Actions (Centered & Responsive) */}
        <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          {isMonthClosed ? (
            <Button variant="outline" size="sm" onClick={() => setIsUnlockModalOpen(true)} style={{ borderColor: "var(--color-warning)", color: "var(--color-warning)" }}>
              <Lock size={16} style={{ marginRight: "0.5rem" }} /> Mes Cerrado
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setIsClosingModalOpen(true)}>
              <Lock size={16} style={{ marginRight: "0.5rem" }} /> Cerrar Mes
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={() => setIsCompanyModalOpen(true)}>
            Empresas
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsReceiptsModalOpen(true)}>
            Cobros
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsSummaryModalOpen(true)}>
            <FileText size={16} style={{ marginRight: "0.5rem" }} /> Resumen
          </Button>
        </div>
      </div>
      
      {isMonthClosed && (
        <div style={{ 
          marginBottom: "1rem", padding: "0.75rem", 
          backgroundColor: "var(--color-warning-bg)", border: "1px solid var(--color-warning)", 
          borderRadius: "var(--radius-md)", color: "var(--color-warning)",
          display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem"
        }}>
          <Lock size={16} />
          <span>Este mes está cerrado. Para editarlo, desbloquéalo con tu contraseña.</span>
        </div>
      )}

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
          <span style={{ fontSize: "0.7rem", color: "var(--color-text-secondary)", display: "block", textTransform: "uppercase" }}>Cobrado</span>
          <span style={{ fontSize: "1rem", fontWeight: "bold", color: "var(--color-success)" }}>
            {formatCurrency(totalReceivedThisMonth)}
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
          <span style={{ fontSize: "1rem", fontWeight: "bold", color: "var(--color-warning)" }}>{avgHoursPerWorkedDay.toFixed(1)}h</span>
        </div>

        {/* Neto/nomina no aplica en modo horas + cobros */}
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
              
              const isSelected = ymdUTC(day) === ymdUTC(selectedDate);
              const now = new Date();
              const isToday = ymdUTC(day) === ymdUTC(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())));
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
                    {day.getUTCDate()}
                  </span>
                  {hasData && (
                    <div style={{ marginTop: "0px", fontSize: "0.5rem", fontWeight: 600, color: "var(--color-success)", lineHeight: 1 }}>
                    {Number(dayTotal || 0).toFixed(1)}h
                  </div>
                  )}
                  {isToday && !isSelected && (
                    <div style={{ position: "absolute", bottom: "2px", width: "3px", height: "3px", borderRadius: "50%", backgroundColor: "var(--color-primary)" }} />
                  )}
                </button>
              );
            })}
          </div>
          
          {/* Excedente (Tax Free) Banner - Inside Calendar Card, at the bottom */}
          {payroll && payroll.excedenteLibre > 0 && (
            <div style={{
              marginTop: "1rem",
              padding: "0.75rem",
              backgroundColor: "var(--color-success-bg)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-success)",
              color: "var(--color-success)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%"
            }}>
               <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <CheckCircle size={20} />
                  <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>Excedente Libre</span>
               </div>
               <span style={{ fontSize: "1.125rem", fontWeight: "bold" }}>
                  {formatCurrency(payroll.excedenteLibre)}
               </span>
            </div>
          )}
        </div>
      </div>

      {/* Summary Modal */}
      <Modal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        title="Resumen Detallado"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ padding: "1rem", backgroundColor: "var(--color-surface)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
            <h4 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "0.5rem" }}>RESUMEN DEL MES</h4>
            <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--color-text)" }}>
              {Number(stats?.totalHours || 0).toFixed(1)}h
            </div>
            <div style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
              Cobrado: {formatCurrency(totalReceivedThisMonth)}
            </div>
          </div>
        </div>
      </Modal>

      {/* Receipts Modal */}
      <Modal
        isOpen={isReceiptsModalOpen}
        onClose={() => setIsReceiptsModalOpen(false)}
        title="Cobros del mes (se refleja en Banco)"
      >
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {companies.length === 0 ? (
            <div style={{ color: "var(--color-text-secondary)" }}>No tienes empresas creadas.</div>
          ) : (
            companies.map((c) => {
              const cid = String(c._id);
              const v = receiptDrafts[cid] ?? "";
              return (
                <div key={cid} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", padding: "0.75rem", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", background: "var(--color-surface)" }}>
                  <div style={{ fontWeight: 700, minWidth: 0 }}>{c.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: "0 0 auto" }}>
                    <input
                      value={v}
                      onChange={(e) => setReceiptDrafts((prev) => ({ ...prev, [cid]: e.target.value }))}
                      inputMode="decimal"
                      placeholder="0.00"
                      style={{
                        width: 140,
                        padding: "0.55rem 0.7rem",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--color-border)",
                        background: "rgba(15, 23, 42, 0.18)",
                        color: "var(--color-text)"
                      }}
                    />
                    <button
                      type="button"
                      title="Guardar"
                      onClick={() => saveReceipt(cid)}
                      disabled={savingCompanyId === cid}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        border: "1px solid var(--color-border)",
                        background: "rgba(15, 23, 42, 0.18)",
                        cursor: savingCompanyId === cid ? "wait" : "pointer",
                        opacity: savingCompanyId === cid ? 0.6 : 1
                      }}
                    >
                      <Save size={18} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Modal>

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
                        {entry.hours}h
                      </div>
                      {entry.notes && <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginTop: "0.25rem" }}>"{entry.notes}"</div>}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: "bold", color: "var(--color-success)", fontSize: "1.125rem" }}>
                        {Number(entry.hours || 0).toFixed(1)}h
                      </div>
                      <button 
                        onClick={() => handleDelete(entry._id)}
                        disabled={isMonthClosed}
                        style={{ 
                          background: "none", 
                          border: "none", 
                          color: isMonthClosed ? "var(--color-text-secondary)" : "var(--color-danger)", 
                          cursor: isMonthClosed ? "not-allowed" : "pointer", 
                          fontSize: "0.75rem", 
                          marginTop: "0.25rem", 
                          textDecoration: isMonthClosed ? "none" : "underline" 
                        }}
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
            opacity: isMonthClosed ? 0.5 : 1,
            pointerEvents: isMonthClosed ? "none" : "auto"
          }}>
             <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>
               {selectedDateEntries.length > 0 ? "Añadir otro registro" : "Registrar actividad"}
             </h3>
             <form onSubmit={handleCreateEntry} style={{ display: "grid", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>EMPRESA</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "0.5rem" }}>
                    {companies.map(c => {
                      const isSelected = entryForm.companyId === c._id;
                      return (
                        <div 
                          key={c._id}
                          onClick={() => {
                            setEntryForm({
                              ...entryForm,
                              companyId: c._id,
                              hourlyRate: 0
                            });
                          }}
                          style={{
                            padding: "0.75rem",
                            borderRadius: "var(--radius-md)",
                            border: isSelected ? "2px solid var(--color-primary)" : "1px solid var(--color-border)",
                            backgroundColor: isSelected ? "var(--color-primary-light)" : "var(--color-surface)",
                            color: isSelected ? "var(--color-primary)" : "var(--color-text)",
                            cursor: "pointer",
                            textAlign: "center",
                            fontSize: "0.875rem",
                            fontWeight: isSelected ? 600 : 400,
                            transition: "all 0.2s"
                          }}
                        >
                          {c.name}
                        </div>
                      );
                    })}
                    {companies.length === 0 && <p style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>No hay empresas. Añade una arriba.</p>}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <Input 
                    label="HORAS" 
                    type="number" step="0.1" required 
                    placeholder="0.0"
                    value={entryForm.hours}
                    onChange={(e) => setEntryForm({...entryForm, hours: e.target.value})}
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

      {/* Modal: Close Month */}
      <Modal 
        isOpen={isClosingModalOpen} 
        onClose={() => setIsClosingModalOpen(false)} 
        title={`Cerrar Mes de ${currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ padding: "1rem", backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)" }}>
            <h4 style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "1rem", color: "var(--color-text-secondary)" }}>RESUMEN DE TRANSFERENCIA</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Neto de Nómina</span>
                <span style={{ fontWeight: 600 }}>{formatCurrency(payroll?.netoNomina || 0)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Excedente Libre</span>
                <span style={{ fontWeight: 600, color: "var(--color-success)" }}>+{formatCurrency(payroll?.excedenteLibre || 0)}</span>
              </div>
              <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "0.5rem", marginTop: "0.5rem", display: "flex", justifyContent: "space-between", fontSize: "1.1rem", fontWeight: "bold" }}>
                <span>Total a Banco</span>
                <span style={{ color: "var(--color-primary)" }}>{formatCurrency(payroll?.totalRealCobrado || 0)}</span>
              </div>
            </div>
          </div>

          <div style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", lineHeight: "1.5" }}>
            <p style={{ marginBottom: "0.5rem" }}><strong>⚠️ Atención:</strong></p>
            <ul style={{ paddingLeft: "1.5rem", margin: 0 }}>
              <li>El mes quedará bloqueado y no podrás editar horas ni empresas.</li>
              <li>El saldo neto se transferirá automáticamente a tu Banco.</li>
              <li>Para hacer cambios futuros necesitarás tu contraseña.</li>
            </ul>
          </div>

          <label style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", fontSize: "0.9rem", cursor: "pointer" }}>
            <input 
              type="checkbox" 
              checked={confirmClose} 
              onChange={(e) => setConfirmClose(e.target.checked)} 
              style={{ marginTop: "0.25rem" }}
            />
            <span>Confirmo que quiero cerrar este mes y transferir el saldo al Banco.</span>
          </label>

          <div style={{ display: "flex", gap: "1rem" }}>
            <Button variant="ghost" onClick={() => setIsClosingModalOpen(false)} style={{ flex: 1 }}>Cancelar</Button>
            <Button 
              variant="primary" 
              disabled={!confirmClose} 
              onClick={handleCloseMonth} 
              style={{ flex: 1 }}
            >
              <Lock size={16} style={{ marginRight: "0.5rem" }} /> Cerrar y Transferir
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Unlock Month */}
      <Modal 
        isOpen={isUnlockModalOpen} 
        onClose={() => setIsUnlockModalOpen(false)} 
        title="Desbloquear Mes"
      >
        <form onSubmit={handleUnlockMonth} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ textAlign: "center", color: "var(--color-warning)" }}>
            <div style={{ margin: "0 auto 1rem", width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "var(--color-warning-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Lock size={24} />
            </div>
            <p style={{ fontWeight: 600 }}>Mes Protegido</p>
            <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", marginTop: "0.5rem" }}>
              Introduce tu contraseña para desbloquear este mes.
            </p>
          </div>

          <div style={{ padding: "1rem", backgroundColor: "var(--color-surface)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-warning)", fontSize: "0.875rem" }}>
            <strong style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-warning)", marginBottom: "0.5rem" }}>
              <AlertTriangle size={16} /> Advertencia
            </strong>
            Al desbloquear, el saldo transferido al Banco se revertirá. Si haces cambios en la nómina, deberás volver a cerrar el mes para actualizar el Banco.
          </div>

          <Input 
            label="Contraseña" 
            type="password" 
            placeholder="Tu contraseña de acceso"
            value={unlockPassword}
            onChange={(e) => setUnlockPassword(e.target.value)}
            required
          />

          <div style={{ display: "flex", gap: "1rem" }}>
            <Button type="button" variant="ghost" onClick={() => setIsUnlockModalOpen(false)} style={{ flex: 1 }}>Cancelar</Button>
            <Button type="submit" variant="primary" style={{ flex: 1, backgroundColor: "var(--color-warning)", borderColor: "var(--color-warning)" }}>
              Desbloquear
            </Button>
          </div>
        </form>
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
            label={`Precio Hora Estándar (${formatCurrency(0).replace("0,00", "").trim()})`} type="number" step="0.01" required placeholder="Ej: 15.50"
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
          <h3 style={{ fontSize: "1rem", fontWeight: 600 }}>Complementos (Aumentan Nómina)</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <Input label={`Beneficios (${formatCurrency(0).replace("0,00", "").trim()})`} type="number" step="0.01" value={companyForm.supplements?.benefits || 0} onChange={(e) => setCompanyForm({...companyForm, supplements: { ...companyForm.supplements, benefits: parseFloat(e.target.value) || 0 }})} />
            <Input label={`Plus Convenio (${formatCurrency(0).replace("0,00", "").trim()})`} type="number" step="0.01" value={companyForm.supplements?.agreementBonus || 0} onChange={(e) => setCompanyForm({...companyForm, supplements: { ...companyForm.supplements, agreementBonus: parseFloat(e.target.value) || 0 }})} />
            <Input label={`Prorrata Pagas (${formatCurrency(0).replace("0,00", "").trim()})`} type="number" step="0.01" value={companyForm.supplements?.proratedPayments || 0} onChange={(e) => setCompanyForm({...companyForm, supplements: { ...companyForm.supplements, proratedPayments: parseFloat(e.target.value) || 0 }})} />
            <Input label={`Mejora Voluntaria (${formatCurrency(0).replace("0,00", "").trim()})`} type="number" step="0.01" value={companyForm.supplements?.voluntaryImprovement || 0} onChange={(e) => setCompanyForm({...companyForm, supplements: { ...companyForm.supplements, voluntaryImprovement: parseFloat(e.target.value) || 0 }})} />
            <Input label={`Otros (${formatCurrency(0).replace("0,00", "").trim()})`} type="number" step="0.01" value={companyForm.supplements?.other || 0} onChange={(e) => setCompanyForm({...companyForm, supplements: { ...companyForm.supplements, other: parseFloat(e.target.value) || 0 }})} />
          </div>
          <hr style={{ border: "0", borderTop: "1px solid var(--color-border)", margin: "0.5rem 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 600 }}>Límite Salarial</h3>
            <label style={{ display: "flex", gap: "0.5rem", fontSize: "0.875rem" }}>
              <input type="checkbox" checked={companyForm.limitRule?.enabled || false} onChange={(e) => setCompanyForm({...companyForm, limitRule: { ...companyForm.limitRule, enabled: e.target.checked }})} /> Activar
            </label>
          </div>
          {companyForm.limitRule?.enabled && (
             <Input label={`Límite (${formatCurrency(0).replace("0,00", "").trim()})`} type="number" step="0.01" value={companyForm.limitRule?.amount || 1600} onChange={(e) => setCompanyForm({...companyForm, limitRule: { ...companyForm.limitRule, amount: parseFloat(e.target.value) || 0 }})} />
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
