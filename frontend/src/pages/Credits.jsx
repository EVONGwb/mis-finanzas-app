import { useState, useEffect } from "react";
import { apiFetch } from "../lib/api";
import { getToken } from "../lib/auth";
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
  Edit2
} from "lucide-react";

export default function Credits() {
  const { formatCurrency } = useCurrency();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  
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

  useEffect(() => {
    fetchCredits();
  }, []);

  const fetchCredits = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/credits", { token: getToken() });
      setData(res.data);
    } catch (error) {
      console.error("Error loading credits:", error);
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
        token: getToken(),
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
        token: getToken(),
        body: paymentForm
      });

      setIsPaymentModalOpen(false);
      setPaymentForm({ amount: "", date: new Date().toISOString().split("T")[0], note: "" });
      fetchCredits();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDeleteCredit = async (id) => {
    // Eliminar confirmación: if (!window.confirm("¿Estás seguro de eliminar este registro y todo su historial?")) return;
    try {
      await apiFetch(`/credits/${id}`, { method: "DELETE", token: getToken() });
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

  const openPaymentModal = (credit) => {
    setSelectedCredit(credit);
    setPaymentForm({ amount: "", date: new Date().toISOString().split("T")[0], note: "" });
    setIsPaymentModalOpen(true);
  };

  // UI Helpers
  const getProgressColor = (progress) => {
    if (progress >= 100) return "var(--color-success)";
    if (progress > 50) return "var(--color-primary)";
    return "var(--color-warning)";
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: "5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.875rem", fontWeight: "bold", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <HandCoins className="text-success" /> Me Deben
          </h1>
          <p style={{ color: "var(--color-text-secondary)" }}>Control de dinero prestado y cuentas por cobrar</p>
        </div>
        <Button onClick={() => { resetCreditForm(); setIsCreditModalOpen(true); }}>
          <Plus size={18} style={{ marginRight: "0.5rem" }} /> Nuevo Préstamo
        </Button>
      </div>

      {/* KPIs */}
      {loading ? (
        <div style={{ display: "grid", gap: "1.5rem", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", marginBottom: "2rem" }}>
          <Skeleton height="120px" />
          <Skeleton height="120px" />
          <Skeleton height="120px" />
        </div>
      ) : (
        <div style={{ display: "grid", gap: "1.5rem", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", marginBottom: "2rem" }}>
          <StatsCard 
            title="Total por Cobrar" 
            value={`$${data?.summary?.totalPending?.toLocaleString() || "0"}`} 
            icon={DollarSign} 
            color="warning" 
          />
          <StatsCard 
            title="Total Recuperado" 
            value={`$${data?.summary?.totalCollectedGlobal?.toLocaleString() || "0"}`} 
            icon={CheckCircle} 
            color="success" 
          />
          <StatsCard 
            title="Progreso Cobro" 
            value={`${data?.summary?.globalProgress?.toFixed(1) || "0"}%`} 
            icon={PieChart} 
            color="primary" 
          />
        </div>
      )}

      {/* Lista de Créditos */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {loading ? (
          <Skeleton height="200px" />
        ) : data?.list?.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", backgroundColor: "var(--color-surface)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
            <p style={{ color: "var(--color-text-secondary)" }}>No tienes préstamos pendientes de cobro.</p>
          </div>
        ) : (
          data?.list?.map(credit => (
            <Card key={credit._id} padding="0">
              <div style={{ 
                padding: "1.5rem", 
                backgroundColor: credit.status === 'paid' ? 'rgba(16, 185, 129, 0.1)' : 'var(--color-surface)',
                borderBottom: "1px solid var(--color-border)"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
                      <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text)" }}>{credit.name}</h3>
                      {credit.status === 'paid' ? (
                        <Badge variant="success">COBRADO</Badge>
                      ) : (
                        <Badge variant="warning">PENDIENTE</Badge>
                      )}
                    </div>
                    {credit.debtor && (
                      <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>Deudor: {credit.debtor}</p>
                    )}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text)" }}>
                      ${credit.totalAmount.toLocaleString()}
                    </div>
                    <div style={{ fontSize: "0.875rem", color: credit.remaining > 0 ? "var(--color-warning)" : "var(--color-success)" }}>
                      Falta cobrar: ${credit.remaining.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Barra de Progreso */}
                <div style={{ position: "relative", height: "8px", backgroundColor: "#E5E7EB", borderRadius: "99px", overflow: "hidden", marginBottom: "1rem" }}>
                  <div style={{ 
                    position: "absolute", 
                    top: 0, left: 0, bottom: 0, 
                    width: `${credit.progress}%`, 
                    backgroundColor: getProgressColor(credit.progress),
                    transition: "width 0.5s ease"
                  }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                  <span>Recuperado: ${credit.totalPaid.toLocaleString()} ({credit.progress.toFixed(1)}%)</span>
                  {credit.dueDate && <span>Vence: {new Date(credit.dueDate).toLocaleDateString()}</span>}
                </div>
              </div>

              {/* Acciones */}
              <div style={{ 
                padding: "1rem 1.5rem", 
                backgroundColor: "var(--color-surface-hover)", 
                display: "flex", 
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <Button size="sm" variant="ghost" onClick={() => openEditModal(credit)} title="Editar">
                    <Edit2 size={16} />
                  </Button>
                  <Button size="sm" variant="ghost" style={{ color: "var(--color-danger)" }} onClick={() => handleDeleteCredit(credit._id)} title="Eliminar">
                    <Trash2 size={16} />
                  </Button>
                </div>
                
                {credit.status === 'active' && (
                  <Button size="sm" onClick={() => openPaymentModal(credit)}>
                    <Plus size={16} style={{ marginRight: "0.25rem" }} /> Registrar Cobro
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Modal: Crear/Editar Crédito */}
      <Modal 
        isOpen={isCreditModalOpen} 
        onClose={() => setIsCreditModalOpen(false)} 
        title={creditForm.id ? "Editar Préstamo" : "Nuevo Préstamo"}
      >
        <form onSubmit={handleSaveCredit} style={{ display: "grid", gap: "1rem" }}>
          <Input 
            label="Concepto" 
            required 
            placeholder="Ej: Préstamo a Juan"
            value={creditForm.name}
            onChange={(e) => setCreditForm({...creditForm, name: e.target.value})}
          />
          <Input 
            label="Deudor (Quién me debe)" 
            required
            placeholder="Ej: Juan Pérez"
            value={creditForm.debtor}
            onChange={(e) => setCreditForm({...creditForm, debtor: e.target.value})}
          />
          <Input 
            label={`Importe a Prestar (${formatCurrency(0).replace("0,00", "").trim()})`} 
            type="number" 
            step="0.01" 
            required 
            value={creditForm.totalAmount}
            onChange={(e) => setCreditForm({...creditForm, totalAmount: e.target.value})}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <Input 
              label="Fecha Préstamo" 
              type="date" 
              value={creditForm.startDate}
              onChange={(e) => setCreditForm({...creditForm, startDate: e.target.value})}
            />
            <Input 
              label="Fecha Límite (Opcional)" 
              type="date" 
              value={creditForm.dueDate}
              onChange={(e) => setCreditForm({...creditForm, dueDate: e.target.value})}
            />
          </div>
          <Input 
            label="Descripción" 
            placeholder="Detalles adicionales..."
            value={creditForm.description}
            onChange={(e) => setCreditForm({...creditForm, description: e.target.value})}
          />
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
        title="Registrar Cobro Recibido"
      >
        <div style={{ marginBottom: "1.5rem", padding: "1rem", backgroundColor: "var(--color-surface-hover)", borderRadius: "var(--radius-sm)" }}>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>Concepto: <strong>{selectedCredit?.name}</strong></p>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>Falta cobrar: <strong style={{ color: "var(--color-warning)" }}>{selectedCredit && formatCurrency(selectedCredit.remaining)}</strong></p>
        </div>

        <form onSubmit={handleAddPayment} style={{ display: "grid", gap: "1rem" }}>
          <Input 
            label={`Importe Recibido (${formatCurrency(0).replace("0,00", "").trim()})`} 
            type="number" 
            step="0.01" 
            required 
            max={selectedCredit?.remaining}
            value={paymentForm.amount}
            onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
          />
          <Input 
            label="Fecha del Cobro" 
            type="date" 
            required 
            value={paymentForm.date}
            onChange={(e) => setPaymentForm({...paymentForm, date: e.target.value})}
          />
          <Input 
            label="Nota (Opcional)" 
            placeholder="Bizum, efectivo..."
            value={paymentForm.note}
            onChange={(e) => setPaymentForm({...paymentForm, note: e.target.value})}
          />
          
          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            <Button type="button" variant="ghost" onClick={() => setIsPaymentModalOpen(false)} style={{ flex: 1 }}>Cancelar</Button>
            <Button type="submit" style={{ flex: 1 }}>Confirmar Cobro</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
