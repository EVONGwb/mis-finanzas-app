import { useState, useEffect, useMemo } from "react";
import { apiFetch } from "../lib/api";
import { Card, StatsCard } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Input } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { Skeleton } from "../components/ui/Skeleton";
import { useCurrency } from "../context/CurrencyContext";
import { 
  CreditCard, 
  DollarSign, 
  PieChart, 
  CheckCircle, 
  Plus, 
  Trash2, 
  Edit2, 
  Search,
  Filter,
  Calendar,
  ArrowRight,
  Clock,
  AlertCircle,
  MoreHorizontal,
  ChevronRight,
  ArrowUpRight
} from "lucide-react";

export default function Debts() {
  const { formatCurrency } = useCurrency();
  const [data, setData] = useState({ summary: { totalPending: 0, totalPaidGlobal: 0, globalProgress: 0 }, list: [] });
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("pending"); // 'all', 'pending', 'paid', 'overdue'
  
  // Modals
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  // Forms & Selected Item
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [debtDetails, setDebtDetails] = useState(null); // For fetching full details with history
  const [debtForm, setDebtForm] = useState({
    id: null,
    name: "",
    creditor: "",
    totalAmount: "",
    startDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    description: ""
  });
  
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    date: new Date().toISOString().split("T")[0],
    note: ""
  });

  useEffect(() => {
    fetchDebts();
  }, []);

  const fetchDebts = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/debts");
      if (res && res.data) {
        setData(res.data);
      } else {
        setData({ summary: { totalPending: 0, totalPaidGlobal: 0, globalProgress: 0 }, list: [] });
      }
    } catch (error) {
      console.error("Error loading debts:", error);
      setData({ summary: { totalPending: 0, totalPaidGlobal: 0, globalProgress: 0 }, list: [] });
    } finally {
      setLoading(false);
    }
  };

  const fetchDebtDetails = async (id) => {
    try {
      // Assuming endpoint exists, otherwise we use selectedDebt
      // const res = await apiFetch(`/debts/${id}`, { token: getToken() });
      // setDebtDetails(res.data);
      // Fallback if no specific endpoint:
      setDebtDetails(selectedDebt); 
    } catch (error) {
      console.error(error);
    }
  };

  const handleSaveDebt = async (e) => {
    e.preventDefault();
    try {
      const isEdit = !!debtForm.id;
      const url = isEdit ? `/debts/${debtForm.id}` : "/debts";
      const method = isEdit ? "PATCH" : "POST";

      await apiFetch(url, {
        method,
        body: debtForm
      });

      setIsDebtModalOpen(false);
      resetDebtForm();
      fetchDebts();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    if (!selectedDebt) return;
    try {
      await apiFetch(`/debts/${selectedDebt._id}/payments`, {
        method: "POST",
        body: paymentForm
      });

      setIsPaymentModalOpen(false);
      setPaymentForm({ amount: "", date: new Date().toISOString().split("T")[0], note: "" });
      fetchDebts();
      if (isDetailModalOpen) {
        // Refresh details if open
        // fetchDebtDetails(selectedDebt._id);
        setIsDetailModalOpen(false); // Close detail to refresh list
      }
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDeleteDebt = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar esta deuda?")) return;
    try {
      await apiFetch(`/debts/${id}`, { method: "DELETE" });
      setIsDetailModalOpen(false);
      fetchDebts();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm("¿Eliminar este pago?")) return;
    try {
      await apiFetch(`/debts/${selectedDebt._id}/payments/${paymentId}`, {
        method: "DELETE"
      });
      fetchDebts();
      // Refresh detail modal
      const updated = data.list.find(d => d._id === selectedDebt._id);
      if (updated) {
        setSelectedDebt(updated);
        setDebtDetails(updated);
      }
    } catch (error) {
      alert(error.message);
    }
  };

  const resetDebtForm = () => {
    setDebtForm({
      id: null,
      name: "",
      creditor: "",
      totalAmount: "",
      startDate: new Date().toISOString().split("T")[0],
      dueDate: "",
      description: ""
    });
  };

  const openEditModal = (debt) => {
    setDebtForm({
      id: debt._id,
      name: debt.name,
      creditor: debt.creditor || "",
      totalAmount: debt.totalAmount,
      startDate: debt.startDate ? debt.startDate.split("T")[0] : "",
      dueDate: debt.dueDate ? debt.dueDate.split("T")[0] : "",
      description: debt.description || ""
    });
    setIsDebtModalOpen(true);
  };

  const openPaymentModal = (debt, e) => {
    e?.stopPropagation();
    setSelectedDebt(debt);
    setPaymentForm({ amount: "", date: new Date().toISOString().split("T")[0], note: "" });
    setIsPaymentModalOpen(true);
  };

  const openDetailModal = (debt) => {
    setSelectedDebt(debt);
    setDebtDetails(debt); // Set initial data
    // fetchDebtDetails(debt._id); // Fetch more if needed
    setIsDetailModalOpen(true);
  };

  // Filter Logic
  const filteredDebts = useMemo(() => {
    if (!data?.list) return [];
    return data.list.filter(debt => {
      const matchesSearch = debt.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (debt.creditor && debt.creditor.toLowerCase().includes(searchQuery.toLowerCase()));
      
      if (!matchesSearch) return false;

      const today = new Date();
      const dueDate = debt.dueDate ? new Date(debt.dueDate) : null;
      const isOverdue = dueDate && dueDate < today && debt.remaining > 0;

      if (activeTab === 'all') return true;
      if (activeTab === 'pending') return debt.remaining > 0;
      if (activeTab === 'paid') return debt.remaining <= 0;
      if (activeTab === 'overdue') return isOverdue;
      
      return true;
    });
  }, [data, searchQuery, activeTab]);

  const upcomingPayments = useMemo(() => {
    if (!data?.list) return [];
    return data.list
      .filter(d => d.remaining > 0 && d.dueDate)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 5);
  }, [data]);

  // UI Helpers
  const getProgressColor = (progress) => {
    if (progress >= 100) return "var(--color-success)";
    if (progress > 50) return "var(--color-primary)";
    return "var(--color-warning)";
  };

  const handleCopyTrackingCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      alert("Código copiado");
    } catch {
      alert("No se pudo copiar el código");
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: "6rem" }}>
      {/* 1) Header Superior */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "bold", color: "var(--color-text)" }}>Deudas</h1>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>Gestión de pasivos</p>
        </div>
        <Button onClick={() => { resetDebtForm(); setIsDebtModalOpen(true); }} size="sm">
          <Plus size={18} style={{ marginRight: "0.25rem" }} /> Nueva
        </Button>
      </div>

      {/* 2) Buscador + Filtros */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ position: "relative", marginBottom: "1rem" }}>
          <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-secondary)" }} />
          <input 
            type="text" 
            placeholder="Buscar deuda..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              width: "100%", 
              padding: "0.75rem 0.75rem 0.75rem 2.5rem", 
              borderRadius: "var(--radius-md)", 
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--color-surface)",
              color: "var(--color-text)",
              fontSize: "0.9rem"
            }} 
          />
        </div>
        <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.5rem", scrollbarWidth: "none" }}>
          {[
            { id: 'pending', label: 'Pendientes' },
            { id: 'all', label: 'Todas' },
            { id: 'overdue', label: 'Vencidas' },
            { id: 'paid', label: 'Pagadas' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "99px",
                fontSize: "0.85rem",
                fontWeight: 500,
                whiteSpace: "nowrap",
                border: activeTab === tab.id ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
                backgroundColor: activeTab === tab.id ? "var(--color-primary-light)" : "var(--color-surface)",
                color: activeTab === tab.id ? "var(--color-primary)" : "var(--color-text-secondary)",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3) Resumen Compacto */}
      {loading ? (
        <Skeleton height="150px" style={{ marginBottom: "2rem" }} />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "2rem" }}>
          <div style={{ backgroundColor: "var(--color-surface)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", color: "var(--color-text-secondary)", fontSize: "0.8rem" }}>
              <AlertCircle size={14} /> Pendiente
            </div>
            <div style={{ fontSize: "1.25rem", fontWeight: "bold", color: "var(--color-danger)" }}>
              {formatCurrency(data?.summary?.totalPending || 0)}
            </div>
          </div>
          <div style={{ backgroundColor: "var(--color-surface)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", color: "var(--color-text-secondary)", fontSize: "0.8rem" }}>
              <CheckCircle size={14} /> Pagado
            </div>
            <div style={{ fontSize: "1.25rem", fontWeight: "bold", color: "var(--color-success)" }}>
              {formatCurrency(data?.summary?.totalPaidGlobal || 0)}
            </div>
          </div>
          <div style={{ gridColumn: "1 / -1", backgroundColor: "var(--color-surface)", padding: "1.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <span style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", display: "block", marginBottom: "0.25rem" }}>Progreso Global</span>
              <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--color-primary)" }}>
                {(data?.summary?.globalProgress || 0).toFixed(1)}%
              </div>
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                {data?.list?.filter(d => d.remaining <= 0).length} de {data?.list?.length} deudas saldadas
              </span>
            </div>
            <div style={{ width: "60px", height: "60px", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <PieChart size={40} className="text-primary" />
            </div>
          </div>
        </div>
      )}

      {/* 4) Próximos Pagos */}
      {upcomingPayments.length > 0 && (
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 600 }}>Próximos Vencimientos</h3>
          </div>
          <div style={{ display: "flex", gap: "1rem", overflowX: "auto", paddingBottom: "1rem", scrollbarWidth: "none" }}>
            {upcomingPayments.map(debt => {
               const isOverdue = new Date(debt.dueDate) < new Date();
               return (
                <div key={debt._id} onClick={() => openDetailModal(debt)} style={{ 
                  minWidth: "200px", 
                  backgroundColor: "var(--color-surface)", 
                  padding: "1rem", 
                  borderRadius: "var(--radius-md)", 
                  border: isOverdue ? "1px solid var(--color-danger)" : "1px solid var(--color-border)",
                  cursor: "pointer",
                  position: "relative"
                }}>
                  {isOverdue && <div style={{ position: "absolute", top: "0.5rem", right: "0.5rem", width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--color-danger)" }}></div>}
                  <div style={{ fontWeight: 600, marginBottom: "0.25rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{debt.name}</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: "var(--color-text)", marginBottom: "0.5rem" }}>{formatCurrency(debt.remaining)}</div>
                  <div style={{ fontSize: "0.75rem", color: isOverdue ? "var(--color-danger)" : "var(--color-text-secondary)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <Calendar size={12} /> {new Date(debt.dueDate).toLocaleDateString()}
                  </div>
                </div>
               );
            })}
          </div>
        </div>
      )}

      {/* 5) Todas las deudas */}
      <div>
        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>Listado de Deudas</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {loading ? (
             <>
              <Skeleton height="100px" />
              <Skeleton height="100px" />
             </>
          ) : filteredDebts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--color-text-secondary)" }}>
              <p>No se encontraron deudas.</p>
            </div>
          ) : (
            filteredDebts.map(debt => (
              <div 
                key={debt._id} 
                onClick={() => openDetailModal(debt)}
                style={{ 
                  backgroundColor: "var(--color-surface)", 
                  borderRadius: "var(--radius-lg)", 
                  padding: "1rem",
                  border: "1px solid var(--color-border)",
                  boxShadow: "var(--shadow-sm)",
                  cursor: "pointer",
                  transition: "transform 0.1s"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                  <div>
                    <h4 style={{ fontWeight: "bold", fontSize: "1rem", marginBottom: "0.25rem" }}>{debt.name}</h4>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                       {debt.creditor || "Sin acreedor"}
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ display: "block", fontSize: "1.1rem", fontWeight: "bold", color: debt.remaining > 0 ? "var(--color-text)" : "var(--color-success)" }}>
                      {formatCurrency(debt.remaining > 0 ? debt.remaining : debt.totalAmount)}
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "var(--color-text-secondary)" }}>
                      {debt.remaining > 0 ? "Restante" : "Completado"}
                    </span>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div style={{ marginBottom: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "0.25rem" }}>
                    <span>Progreso</span>
                    <span>{(debt.progress || 0).toFixed(0)}%</span>
                  </div>
                  <div style={{ width: "100%", height: "6px", backgroundColor: "var(--color-surface-hover)", borderRadius: "99px", overflow: "hidden" }}>
                    <div style={{ width: `${debt.progress}%`, height: "100%", backgroundColor: getProgressColor(debt.progress), borderRadius: "99px" }}></div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                   <div style={{ display: "flex", gap: "0.5rem" }}>
                     {debt.status === 'paid' ? (
                       <Badge variant="success" style={{ fontSize: "0.7rem" }}>PAGADA</Badge>
                     ) : (
                        debt.dueDate && new Date(debt.dueDate) < new Date() ? 
                        <Badge variant="danger" style={{ fontSize: "0.7rem" }}>VENCIDA</Badge> :
                        <Badge variant="warning" style={{ fontSize: "0.7rem" }}>PENDIENTE</Badge>
                     )}
                   </div>
                   
                   {debt.remaining > 0 && (
                     <button 
                       onClick={(e) => openPaymentModal(debt, e)}
                       style={{ 
                         backgroundColor: "var(--color-primary-light)", 
                         color: "var(--color-primary)", 
                         border: "none", 
                         padding: "0.5rem 1rem", 
                         borderRadius: "99px", 
                         fontSize: "0.8rem", 
                         fontWeight: 600,
                         display: "flex",
                         alignItems: "center",
                         gap: "0.25rem",
                         cursor: "pointer"
                       }}
                     >
                       <Plus size={14} /> Pagar
                     </button>
                   )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* DETALLE MODAL (Full Screen-ish) */}
      {isDetailModalOpen && selectedDebt && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title="Detalle de la Deuda"
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1.5rem" }}>
            <div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "0.25rem" }}>{selectedDebt.name}</h2>
              <p style={{ color: "var(--color-text-secondary)" }}>{selectedDebt.creditor}</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginBottom: "2rem", textAlign: "center" }}>
            <div style={{ padding: "1rem 0.5rem", backgroundColor: "var(--color-surface-hover)", borderRadius: "var(--radius-md)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>Total</div>
              <div style={{ fontWeight: "bold" }}>{formatCurrency(selectedDebt.totalAmount)}</div>
            </div>
            <div style={{ padding: "1rem 0.5rem", backgroundColor: "var(--color-surface-hover)", borderRadius: "var(--radius-md)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>Pagado</div>
              <div style={{ fontWeight: "bold", color: "var(--color-success)" }}>{formatCurrency(selectedDebt.totalPaid)}</div>
            </div>
            <div style={{ padding: "1rem 0.5rem", backgroundColor: "var(--color-surface-hover)", borderRadius: "var(--radius-md)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>Restante</div>
              <div style={{ fontWeight: "bold", color: "var(--color-danger)" }}>{formatCurrency(selectedDebt.remaining)}</div>
            </div>
          </div>

          {selectedDebt.trackingCode && (
            <div style={{ marginBottom: "1.5rem", padding: "1rem", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", backgroundColor: "var(--color-surface-hover)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem" }}>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginBottom: "0.25rem" }}>Código de seguimiento</div>
                  <div style={{ fontWeight: 800, letterSpacing: "0.04em" }}>{selectedDebt.trackingCode}</div>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleCopyTrackingCode(selectedDebt.trackingCode)}>
                  Copiar
                </Button>
              </div>
            </div>
          )}

          <div style={{ marginBottom: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span style={{ fontWeight: 600 }}>Progreso del pago</span>
              <span style={{ fontWeight: 600 }}>{(selectedDebt.progress || 0).toFixed(1)}%</span>
            </div>
            <div style={{ height: "10px", backgroundColor: "var(--color-surface-hover)", borderRadius: "99px", overflow: "hidden" }}>
              <div style={{ width: `${selectedDebt.progress}%`, height: "100%", backgroundColor: getProgressColor(selectedDebt.progress) }}></div>
            </div>
            {selectedDebt.remaining <= 0 && (
              <div style={{ marginTop: "1rem", padding: "0.75rem", backgroundColor: "var(--color-success-bg)", color: "var(--color-success)", borderRadius: "var(--radius-md)", textAlign: "center", fontWeight: "bold" }}>
                 ¡DEUDA PAGADA! 🎉
              </div>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "2rem" }}>
            {selectedDebt.remaining > 0 && (
              <Button onClick={() => openPaymentModal(selectedDebt)} style={{ display: "flex", justifyContent: "center", gap: "0.5rem" }}>
                <Plus size={18} /> Añadir Pago
              </Button>
            )}
            <Button variant="outline" onClick={() => { setIsDetailModalOpen(false); openEditModal(selectedDebt); }} style={{ display: "flex", justifyContent: "center", gap: "0.5rem" }}>
              <Edit2 size={18} /> Editar
            </Button>
          </div>

          <div style={{ marginBottom: "2rem" }}>
            <Button variant="ghost" onClick={() => handleDeleteDebt(selectedDebt._id)} style={{ width: "100%", color: "var(--color-danger)", display: "flex", justifyContent: "center", gap: "0.5rem" }}>
              <Trash2 size={18} /> Eliminar Deuda
            </Button>
          </div>

          <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "1.5rem" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>Historial</h3>
            {(!selectedDebt.payments || selectedDebt.payments.length === 0) ? (
              <div style={{ padding: "1rem", textAlign: "center", color: "var(--color-text-secondary)", fontStyle: "italic" }}>
                 Sin pagos registrados
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {[...selectedDebt.payments].reverse().map((payment, idx) => (
                  <div key={payment._id || idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", backgroundColor: "var(--color-surface-hover)", borderRadius: "var(--radius-md)" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                      <span style={{ fontWeight: 600, color: "var(--color-success)" }}>+{formatCurrency(payment.amount)}</span>
                      <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                        {new Date(payment.date).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                        {payment.note && ` — ${payment.note}`}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeletePayment(payment._id)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-danger)", padding: "0.25rem", display: "flex", alignItems: "center" }}
                      title="Eliminar pago"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Modal: Crear/Editar Deuda (Original logic preserved) */}
      <Modal 
        isOpen={isDebtModalOpen} 
        onClose={() => setIsDebtModalOpen(false)} 
        title={debtForm.id ? "Editar Deuda" : "Nueva Deuda"}
      >
        <form onSubmit={handleSaveDebt} style={{ display: "grid", gap: "1rem" }}>
          <Input 
            label="Nombre" required placeholder="Ej: Préstamo Coche"
            value={debtForm.name} onChange={(e) => setDebtForm({...debtForm, name: e.target.value})}
          />
          <Input 
            label="Acreedor" placeholder="Ej: Banco"
            value={debtForm.creditor} onChange={(e) => setDebtForm({...debtForm, creditor: e.target.value})}
          />
          <Input 
            label={`Total (${formatCurrency(0).replace(/\d/g, "").replace(/[,.]/g, "").trim()})`} 
            type="number" step="0.01" required 
            value={debtForm.totalAmount} onChange={(e) => setDebtForm({...debtForm, totalAmount: e.target.value})}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <Input label="Inicio" type="date" value={debtForm.startDate} onChange={(e) => setDebtForm({...debtForm, startDate: e.target.value})} />
            <Input label="Vencimiento" type="date" value={debtForm.dueDate} onChange={(e) => setDebtForm({...debtForm, dueDate: e.target.value})} />
          </div>
          <Input label="Notas" value={debtForm.description} onChange={(e) => setDebtForm({...debtForm, description: e.target.value})} />
          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            <Button type="button" variant="ghost" onClick={() => setIsDebtModalOpen(false)} style={{ flex: 1 }}>Cancelar</Button>
            <Button type="submit" style={{ flex: 1 }}>Guardar</Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Añadir Pago */}
      <Modal 
        isOpen={isPaymentModalOpen} 
        onClose={() => setIsPaymentModalOpen(false)} 
        title="Registrar Pago"
      >
        <div style={{ marginBottom: "1.5rem", padding: "1rem", backgroundColor: "var(--color-surface-hover)", borderRadius: "var(--radius-sm)" }}>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>{selectedDebt?.name}</p>
          <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--color-text)" }}>
             {selectedDebt && formatCurrency(selectedDebt.remaining)} <span style={{ fontSize: "0.8rem", fontWeight: "normal" }}>pendientes</span>
          </div>
        </div>

        <form onSubmit={handleAddPayment} style={{ display: "grid", gap: "1rem" }}>
          <Input 
            label={`Importe (${formatCurrency(0).replace(/\d/g, "").replace(/[,.]/g, "").trim()})`} 
            type="number" step="0.01" required max={selectedDebt?.remaining}
            value={paymentForm.amount} onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
          />
          <Input label="Fecha" type="date" required value={paymentForm.date} onChange={(e) => setPaymentForm({...paymentForm, date: e.target.value})} />
          <Input label="Nota" placeholder="Opcional" value={paymentForm.note} onChange={(e) => setPaymentForm({...paymentForm, note: e.target.value})} />
          
          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            <Button type="button" variant="ghost" onClick={() => setIsPaymentModalOpen(false)} style={{ flex: 1 }}>Cancelar</Button>
            <Button type="submit" style={{ flex: 1 }}>Confirmar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
