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
  HandCoins, 
  DollarSign, 
  PieChart, 
  CheckCircle, 
  Plus, 
  Trash2, 
  Edit2,
  Search,
  Calendar,
  AlertCircle,
  Copy,
  Share2
} from "lucide-react";

export default function Credits() {
  const { formatCurrency } = useCurrency();
  const [data, setData] = useState({ summary: { totalPending: 0, totalCollectedGlobal: 0, globalProgress: 0 }, list: [] });
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("pending"); // 'all', 'pending', 'paid', 'overdue'

  // Modals
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  // Forms & Selected Item
  const [selectedCredit, setSelectedCredit] = useState(null);
  const [creditForm, setCreditForm] = useState({
    id: null,
    name: "",
    debtor: "",
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

  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchCredits();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const fetchCredits = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/credits");
      if (res && res.data) {
        setData(res.data);
      } else {
        setData({ summary: { totalPending: 0, totalCollectedGlobal: 0, globalProgress: 0 }, list: [] });
      }
    } catch (error) {
      console.error("Error loading credits:", error);
      setData({ summary: { totalPending: 0, totalCollectedGlobal: 0, globalProgress: 0 }, list: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCredit = async (e) => {
    e.preventDefault();
    try {
      const isEdit = !!creditForm.id;
      const url = isEdit ? `/credits/${creditForm.id}` : "/credits";
      const method = isEdit ? "PATCH" : "POST";

      await apiFetch(url, {
        method,
        body: creditForm
      });

      setIsCreditModalOpen(false);
      resetCreditForm();
      fetchCredits();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    if (!selectedCredit) return;
    try {
      await apiFetch(`/credits/${selectedCredit._id}/payments`, {
        method: "POST",
        body: paymentForm
      });

      setIsPaymentModalOpen(false);
      setPaymentForm({ amount: "", date: new Date().toISOString().split("T")[0], note: "" });
      fetchCredits();
      if (isDetailModalOpen) {
        setIsDetailModalOpen(false);
      }
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDeleteCredit = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este registro?")) return;
    try {
      await apiFetch(`/credits/${id}`, { method: "DELETE" });
      setIsDetailModalOpen(false);
      fetchCredits();
    } catch (error) {
      alert(error.message);
    }
  };

  const resetCreditForm = () => {
    setCreditForm({
      id: null,
      name: "",
      debtor: "",
      totalAmount: "",
      startDate: new Date().toISOString().split("T")[0],
      dueDate: "",
      description: ""
    });
  };

  const openEditModal = (credit) => {
    setCreditForm({
      id: credit._id,
      name: credit.name,
      debtor: credit.debtor || "",
      totalAmount: credit.totalAmount,
      startDate: credit.startDate ? credit.startDate.split("T")[0] : "",
      dueDate: credit.dueDate ? credit.dueDate.split("T")[0] : "",
      description: credit.description || ""
    });
    setIsCreditModalOpen(true);
  };

  const openPaymentModal = (credit, e) => {
    e?.stopPropagation();
    setSelectedCredit(credit);
    setPaymentForm({ amount: "", date: new Date().toISOString().split("T")[0], note: "" });
    setIsPaymentModalOpen(true);
  };

  const openDetailModal = (credit) => {
    setSelectedCredit(credit);
    setIsDetailModalOpen(true);
  };

  // Filter Logic
  const filteredCredits = useMemo(() => {
    if (!data?.list) return [];
    return data.list.filter(credit => {
      const matchesSearch = credit.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (credit.debtor && credit.debtor.toLowerCase().includes(searchQuery.toLowerCase()));
      
      if (!matchesSearch) return false;

      const today = new Date();
      const dueDate = credit.dueDate ? new Date(credit.dueDate) : null;
      const isOverdue = dueDate && dueDate < today && credit.remaining > 0;

      if (activeTab === 'all') return true;
      if (activeTab === 'pending') return credit.remaining > 0;
      if (activeTab === 'paid') return credit.remaining <= 0;
      if (activeTab === 'overdue') return isOverdue;
      
      return true;
    });
  }, [data, searchQuery, activeTab]);

  const upcomingCollections = useMemo(() => {
    if (!data?.list) return [];
    return data.list
      .filter(c => c.remaining > 0 && c.dueDate)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 5);
  }, [data]);

  // UI Helpers
  const getProgressColor = (progress) => {
    if (progress >= 100) return "var(--color-success)";
    if (progress > 50) return "var(--color-primary)";
    return "var(--color-warning)";
  };

  const showToast = (message, variant = "success") => {
    setToast({ message, variant, key: Date.now() });
  };

  const handleCopyTrackingCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      showToast("Código copiado", "success");
    } catch {
      showToast("No se pudo copiar el código", "error");
    }
  };

  const handleShareTrackingCode = async (code) => {
    const message = `Consulta tu cobro en MIS FINANZAS con este código: ${code}`;
    try {
      if (navigator.share) {
        await navigator.share({ text: message });
        return;
      }
      await navigator.clipboard.writeText(message);
      showToast("Mensaje copiado para compartir", "success");
    } catch {
      showToast("No se pudo compartir", "error");
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: "6rem" }}>
      {toast && (
        <div
          key={toast.key}
          style={{
            position: "fixed",
            left: "50%",
            top: "1rem",
            transform: "translateX(-50%)",
            zIndex: 1000,
            padding: "0.75rem 1rem",
            borderRadius: "999px",
            border: "1px solid var(--color-border)",
            backgroundColor: "var(--color-surface)",
            boxShadow: "var(--shadow-sm)",
            color: toast.variant === "error" ? "var(--color-danger)" : "var(--color-success)",
            fontWeight: 700,
            fontSize: "0.9rem"
          }}
        >
          {toast.message}
        </div>
      )}
      {/* 1) Header Superior */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "bold", color: "var(--color-text)" }}>Me Deben</h1>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>Cuentas por cobrar</p>
        </div>
        <Button onClick={() => { resetCreditForm(); setIsCreditModalOpen(true); }} size="sm">
          <Plus size={18} style={{ marginRight: "0.25rem" }} /> Nuevo
        </Button>
      </div>

      {/* 2) Buscador + Filtros */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ position: "relative", marginBottom: "1rem" }}>
          <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-secondary)" }} />
          <input 
            type="text" 
            placeholder="Buscar por nombre..." 
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
            { id: 'all', label: 'Todos' },
            { id: 'overdue', label: 'Vencidos' },
            { id: 'paid', label: 'Cobrados' }
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
              <AlertCircle size={14} /> Por Cobrar
            </div>
            <div style={{ fontSize: "1.25rem", fontWeight: "bold", color: "var(--color-warning)" }}>
              {formatCurrency(data?.summary?.totalPending || 0)}
            </div>
          </div>
          <div style={{ backgroundColor: "var(--color-surface)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", color: "var(--color-text-secondary)", fontSize: "0.8rem" }}>
              <CheckCircle size={14} /> Cobrado
            </div>
            <div style={{ fontSize: "1.25rem", fontWeight: "bold", color: "var(--color-success)" }}>
              {formatCurrency(data?.summary?.totalCollectedGlobal || 0)}
            </div>
          </div>
          <div style={{ gridColumn: "1 / -1", backgroundColor: "var(--color-surface)", padding: "1.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <span style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", display: "block", marginBottom: "0.25rem" }}>Progreso Global</span>
              <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--color-primary)" }}>
                {(data?.summary?.globalProgress || 0).toFixed(1)}%
              </div>
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                {data?.list?.filter(d => d.remaining <= 0).length} de {data?.list?.length} cobrados
              </span>
            </div>
            <div style={{ width: "60px", height: "60px", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <PieChart size={40} className="text-primary" />
            </div>
          </div>
        </div>
      )}

      {/* 4) Próximos Cobros */}
      {upcomingCollections.length > 0 && (
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 600 }}>Próximos Cobros</h3>
          </div>
          <div style={{ display: "flex", gap: "1rem", overflowX: "auto", paddingBottom: "1rem", scrollbarWidth: "none" }}>
            {upcomingCollections.map(credit => {
               const isOverdue = new Date(credit.dueDate) < new Date();
               return (
                <div key={credit._id} onClick={() => openDetailModal(credit)} style={{ 
                  minWidth: "200px", 
                  backgroundColor: "var(--color-surface)", 
                  padding: "1rem", 
                  borderRadius: "var(--radius-md)", 
                  border: isOverdue ? "1px solid var(--color-danger)" : "1px solid var(--color-border)",
                  cursor: "pointer",
                  position: "relative"
                }}>
                  {isOverdue && <div style={{ position: "absolute", top: "0.5rem", right: "0.5rem", width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--color-danger)" }}></div>}
                  <div style={{ fontWeight: 600, marginBottom: "0.25rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{credit.name}</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: "var(--color-text)", marginBottom: "0.5rem" }}>{formatCurrency(credit.remaining)}</div>
                  <div style={{ fontSize: "0.75rem", color: isOverdue ? "var(--color-danger)" : "var(--color-text-secondary)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <Calendar size={12} /> {new Date(credit.dueDate).toLocaleDateString()}
                  </div>
                </div>
               );
            })}
          </div>
        </div>
      )}

      {/* 5) Lista de Créditos */}
      <div>
        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>Listado de Cobros</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {loading ? (
             <>
              <Skeleton height="100px" />
              <Skeleton height="100px" />
             </>
          ) : filteredCredits.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--color-text-secondary)" }}>
              <p>No se encontraron registros.</p>
            </div>
          ) : (
            filteredCredits.map(credit => (
              <div 
                key={credit._id} 
                onClick={() => openDetailModal(credit)}
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
                    <h4 style={{ fontWeight: "bold", fontSize: "1rem", marginBottom: "0.25rem" }}>{credit.name}</h4>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                       {credit.debtor || "Sin deudor"}
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ display: "block", fontSize: "1.1rem", fontWeight: "bold", color: credit.remaining > 0 ? "var(--color-text)" : "var(--color-success)" }}>
                      {formatCurrency(credit.remaining > 0 ? credit.remaining : credit.totalAmount)}
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "var(--color-text-secondary)" }}>
                      {credit.remaining > 0 ? "Falta cobrar" : "Completado"}
                    </span>
                  </div>
                </div>

                {credit.trackingCode && (
                  <div
                    style={{
                      marginBottom: "1rem",
                      padding: "0.85rem",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid rgba(34, 197, 94, 0.35)",
                      backgroundColor: "rgba(34, 197, 94, 0.08)",
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      gap: "0.75rem",
                      alignItems: "center"
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginBottom: "0.25rem", fontWeight: 600 }}>
                        Código de seguimiento
                      </div>
                      <div style={{ fontWeight: 900, letterSpacing: "0.08em", color: "var(--color-success)", fontSize: "1.25rem", lineHeight: 1.1 }}>
                        {credit.trackingCode}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginTop: "0.35rem" }}>
                        Comparte este código con la persona que debe para que pueda ver su progreso.
                      </div>
                    </div>
                    <div style={{ display: "grid", gap: "0.5rem", justifyItems: "end" }}>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleCopyTrackingCode(credit.trackingCode); }}
                        style={{
                          borderRadius: "0.9rem",
                          padding: "0.6rem 0.9rem",
                          border: "1px solid rgba(34, 197, 94, 0.35)",
                          backgroundColor: "rgba(34, 197, 94, 0.10)",
                          color: "var(--color-success)",
                          fontWeight: 800,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          cursor: "pointer",
                          whiteSpace: "nowrap"
                        }}
                      >
                        <Copy size={16} /> Copiar
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleShareTrackingCode(credit.trackingCode); }}
                        style={{
                          borderRadius: "0.9rem",
                          padding: "0.6rem 0.9rem",
                          border: "1px solid var(--color-border)",
                          backgroundColor: "var(--color-surface)",
                          color: "var(--color-text)",
                          fontWeight: 800,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          cursor: "pointer",
                          whiteSpace: "nowrap"
                        }}
                      >
                        <Share2 size={16} /> Compartir
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Progress Bar */}
                <div style={{ marginBottom: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "0.25rem" }}>
                    <span>Progreso</span>
                    <span>{(credit.progress || 0).toFixed(0)}%</span>
                  </div>
                  <div style={{ width: "100%", height: "6px", backgroundColor: "var(--color-surface-hover)", borderRadius: "99px", overflow: "hidden" }}>
                    <div style={{ width: `${credit.progress}%`, height: "100%", backgroundColor: getProgressColor(credit.progress), borderRadius: "99px" }}></div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                   <div style={{ display: "flex", gap: "0.5rem" }}>
                     {credit.status === 'paid' ? (
                       <Badge variant="success" style={{ fontSize: "0.7rem" }}>COBRADO</Badge>
                     ) : (
                        credit.dueDate && new Date(credit.dueDate) < new Date() ? 
                        <Badge variant="danger" style={{ fontSize: "0.7rem" }}>VENCIDO</Badge> :
                        <Badge variant="warning" style={{ fontSize: "0.7rem" }}>PENDIENTE</Badge>
                     )}
                   </div>
                   
                   {credit.remaining > 0 && (
                     <button 
                       onClick={(e) => openPaymentModal(credit, e)}
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
                       <Plus size={14} /> Cobrar
                     </button>
                   )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* DETALLE MODAL (Full Screen-ish) */}
      {isDetailModalOpen && selectedCredit && (
        <Modal 
           isOpen={isDetailModalOpen} 
           onClose={() => setIsDetailModalOpen(false)} 
           title="Detalle del Cobro"
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1.5rem" }}>
              <div>
                <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "0.25rem" }}>{selectedCredit.name}</h2>
                <p style={{ color: "var(--color-text-secondary)" }}>{selectedCredit.debtor}</p>
              </div>
            </div>

            {selectedCredit.trackingCode && (
              <div style={{ marginBottom: "1.5rem", padding: "1rem", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", backgroundColor: "var(--color-surface-hover)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem" }}>
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginBottom: "0.25rem" }}>Código de seguimiento</div>
                    <div style={{ fontWeight: 800, letterSpacing: "0.04em", color: "var(--color-text)" }}>{selectedCredit.trackingCode}</div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleCopyTrackingCode(selectedCredit.trackingCode)}>
                    Copiar
                  </Button>
                </div>
              </div>
            )}

            {/* Main Stats in Detail */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginBottom: "2rem", textAlign: "center" }}>
              <div style={{ padding: "1rem 0.5rem", backgroundColor: "var(--color-surface-hover)", borderRadius: "var(--radius-md)" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>Total</div>
                <div style={{ fontWeight: "bold" }}>{formatCurrency(selectedCredit.totalAmount)}</div>
              </div>
              <div style={{ padding: "1rem 0.5rem", backgroundColor: "var(--color-surface-hover)", borderRadius: "var(--radius-md)" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>Cobrado</div>
                <div style={{ fontWeight: "bold", color: "var(--color-success)" }}>{formatCurrency(selectedCredit.totalPaid)}</div>
              </div>
              <div style={{ padding: "1rem 0.5rem", backgroundColor: "var(--color-surface-hover)", borderRadius: "var(--radius-md)" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>Falta</div>
                <div style={{ fontWeight: "bold", color: "var(--color-warning)" }}>{formatCurrency(selectedCredit.remaining)}</div>
              </div>
            </div>

            {/* Progress */}
            <div style={{ marginBottom: "2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ fontWeight: 600 }}>Progreso del cobro</span>
                <span style={{ fontWeight: 600 }}>{(selectedCredit.progress || 0).toFixed(1)}%</span>
              </div>
              <div style={{ height: "10px", backgroundColor: "var(--color-surface-hover)", borderRadius: "99px", overflow: "hidden" }}>
                <div style={{ width: `${selectedCredit.progress}%`, height: "100%", backgroundColor: getProgressColor(selectedCredit.progress) }}></div>
              </div>
              {selectedCredit.remaining <= 0 && (
                <div style={{ marginTop: "1rem", padding: "0.75rem", backgroundColor: "var(--color-success-bg)", color: "var(--color-success)", borderRadius: "var(--radius-md)", textAlign: "center", fontWeight: "bold" }}>
                   ¡TOTALMENTE COBRADO! 🎉
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "2rem" }}>
               {selectedCredit.remaining > 0 && (
                 <Button onClick={() => openPaymentModal(selectedCredit)} style={{ display: "flex", justifyContent: "center", gap: "0.5rem" }}>
                   <Plus size={18} /> Añadir Cobro
                 </Button>
               )}
               <Button variant="outline" onClick={() => { setIsDetailModalOpen(false); openEditModal(selectedCredit); }} style={{ display: "flex", justifyContent: "center", gap: "0.5rem" }}>
                 <Edit2 size={18} /> Editar
               </Button>
            </div>
            
            <div style={{ marginBottom: "2rem" }}>
               <Button variant="ghost" onClick={() => handleDeleteCredit(selectedCredit._id)} style={{ width: "100%", color: "var(--color-danger)", display: "flex", justifyContent: "center", gap: "0.5rem" }}>
                 <Trash2 size={18} /> Eliminar Registro
               </Button>
            </div>

            {/* Timeline Placeholder */}
            <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "1.5rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>Historial</h3>
              <div style={{ padding: "1rem", textAlign: "center", color: "var(--color-text-secondary)", fontStyle: "italic" }}>
                 (Historial de cobros próximamente)
              </div>
            </div>
        </Modal>
      )}

      {/* Modal: Crear/Editar Crédito */}
      <Modal 
        isOpen={isCreditModalOpen} 
        onClose={() => setIsCreditModalOpen(false)} 
        title={creditForm.id ? "Editar Préstamo" : "Nuevo Préstamo"}
      >
        <form onSubmit={handleSaveCredit} style={{ display: "grid", gap: "1rem" }}>
          <Input 
            label="Concepto" required placeholder="Ej: Préstamo a Juan"
            value={creditForm.name} onChange={(e) => setCreditForm({...creditForm, name: e.target.value})}
          />
          <Input 
            label="Deudor" required placeholder="Ej: Juan Pérez"
            value={creditForm.debtor} onChange={(e) => setCreditForm({...creditForm, debtor: e.target.value})}
          />
          <Input 
            label={`Total (${formatCurrency(0).replace(/\d/g, "").replace(/[,.]/g, "").trim()})`} 
            type="number" step="0.01" required 
            value={creditForm.totalAmount} onChange={(e) => setCreditForm({...creditForm, totalAmount: e.target.value})}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <Input label="Fecha" type="date" value={creditForm.startDate} onChange={(e) => setCreditForm({...creditForm, startDate: e.target.value})} />
            <Input label="Vencimiento" type="date" value={creditForm.dueDate} onChange={(e) => setCreditForm({...creditForm, dueDate: e.target.value})} />
          </div>
          <Input label="Notas" value={creditForm.description} onChange={(e) => setCreditForm({...creditForm, description: e.target.value})} />
          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            <Button type="button" variant="ghost" onClick={() => setIsCreditModalOpen(false)} style={{ flex: 1 }}>Cancelar</Button>
            <Button type="submit" style={{ flex: 1 }}>Guardar</Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Registrar Cobro */}
      <Modal 
        isOpen={isPaymentModalOpen} 
        onClose={() => setIsPaymentModalOpen(false)} 
        title="Registrar Cobro"
      >
        <div style={{ marginBottom: "1.5rem", padding: "1rem", backgroundColor: "var(--color-surface-hover)", borderRadius: "var(--radius-sm)" }}>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>{selectedCredit?.name}</p>
          <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--color-text)" }}>
             {selectedCredit && formatCurrency(selectedCredit.remaining)} <span style={{ fontSize: "0.8rem", fontWeight: "normal" }}>pendientes</span>
          </div>
        </div>

        <form onSubmit={handleAddPayment} style={{ display: "grid", gap: "1rem" }}>
          <Input 
            label={`Importe (${formatCurrency(0).replace(/\d/g, "").replace(/[,.]/g, "").trim()})`} 
            type="number" step="0.01" required max={selectedCredit?.remaining}
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
