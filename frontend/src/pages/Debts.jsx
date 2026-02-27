import { useState, useEffect } from "react";
import { apiFetch } from "../lib/api";
import { getToken } from "../lib/auth";
import { Card, StatsCard } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Input } from "../components/ui/Input";
import { Table, TableRow, TableCell } from "../components/ui/Table";
import { Badge } from "../components/ui/Badge";
import { Skeleton } from "../components/ui/Skeleton";
import { 
  CreditCard, 
  DollarSign, 
  PieChart, 
  CheckCircle, 
  Plus, 
  Trash2, 
  Edit2, 
  MoreHorizontal,
  History
} from "lucide-react";

export default function Debts() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  
  // Forms & Selected Item
  const [selectedDebt, setSelectedDebt] = useState(null);
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
      const res = await apiFetch("/debts", { token: getToken() });
      setData(res.data);
    } catch (error) {
      console.error("Error loading debts:", error);
    } finally {
      setLoading(false);
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
        token: getToken(),
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
        token: getToken(),
        body: paymentForm
      });

      setIsPaymentModalOpen(false);
      setPaymentForm({ amount: "", date: new Date().toISOString().split("T")[0], note: "" });
      fetchDebts();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDeleteDebt = async (id) => {
    // Eliminar confirmación: if (!window.confirm("¿Estás seguro de eliminar esta deuda y todo su historial?")) return;
    try {
      await apiFetch(`/debts/${id}`, { method: "DELETE", token: getToken() });
      fetchDebts();
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

  const openPaymentModal = (debt) => {
    setSelectedDebt(debt);
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
            <CreditCard className="text-danger" /> Deudas
          </h1>
          <p style={{ color: "var(--color-text-secondary)" }}>Control y seguimiento de obligaciones financieras</p>
        </div>
        <Button onClick={() => { resetDebtForm(); setIsDebtModalOpen(true); }}>
          <Plus size={18} style={{ marginRight: "0.5rem" }} /> Nueva Deuda
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
            title="Deuda Pendiente" 
            value={`$${data?.summary?.totalPending?.toLocaleString() || "0"}`} 
            icon={DollarSign} 
            color="danger" 
          />
          <StatsCard 
            title="Total Pagado" 
            value={`$${data?.summary?.totalPaidGlobal?.toLocaleString() || "0"}`} 
            icon={CheckCircle} 
            color="success" 
          />
          <StatsCard 
            title="Progreso Global" 
            value={`${data?.summary?.globalProgress?.toFixed(1) || "0"}%`} 
            icon={PieChart} 
            color="primary" 
          />
        </div>
      )}

      {/* Lista de Deudas */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {loading ? (
          <Skeleton height="200px" />
        ) : data?.list?.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", backgroundColor: "var(--color-surface)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
            <p style={{ color: "var(--color-text-secondary)" }}>No tienes deudas registradas. ¡Genial!</p>
          </div>
        ) : (
          data?.list?.map(debt => (
            <Card key={debt._id} padding="0">
              <div style={{ 
                padding: "1.5rem", 
                backgroundColor: debt.status === 'paid' ? 'rgba(16, 185, 129, 0.1)' : 'var(--color-surface)',
                borderBottom: "1px solid var(--color-border)"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
                      <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text)" }}>{debt.name}</h3>
                      {debt.status === 'paid' ? (
                        <Badge variant="success">PAGADA</Badge>
                      ) : (
                        <Badge variant="warning">ACTIVA</Badge>
                      )}
                    </div>
                    {debt.creditor && (
                      <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>Acreedor: {debt.creditor}</p>
                    )}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text)" }}>
                      ${debt.totalAmount.toLocaleString()}
                    </div>
                    <div style={{ fontSize: "0.875rem", color: debt.remaining > 0 ? "var(--color-danger)" : "var(--color-success)" }}>
                      Pendiente: ${debt.remaining.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Barra de Progreso */}
                <div style={{ position: "relative", height: "8px", backgroundColor: "#E5E7EB", borderRadius: "99px", overflow: "hidden", marginBottom: "1rem" }}>
                  <div style={{ 
                    position: "absolute", 
                    top: 0, left: 0, bottom: 0, 
                    width: `${debt.progress}%`, 
                    backgroundColor: getProgressColor(debt.progress),
                    transition: "width 0.5s ease"
                  }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                  <span>Pagado: {formatCurrency(debt.totalPaid)} ({debt.progress.toFixed(1)}%)</span>
                  {debt.dueDate && <span>Vence: {new Date(debt.dueDate).toLocaleDateString()}</span>}
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
                  <Button size="sm" variant="ghost" onClick={() => openEditModal(debt)} title="Editar">
                    <Edit2 size={16} />
                  </Button>
                  <Button size="sm" variant="ghost" style={{ color: "var(--color-danger)" }} onClick={() => handleDeleteDebt(debt._id)} title="Eliminar">
                    <Trash2 size={16} />
                  </Button>
                </div>
                
                {debt.status === 'active' && (
                  <Button size="sm" onClick={() => openPaymentModal(debt)}>
                    <Plus size={16} style={{ marginRight: "0.25rem" }} /> Añadir Pago
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Modal: Crear/Editar Deuda */}
      <Modal 
        isOpen={isDebtModalOpen} 
        onClose={() => setIsDebtModalOpen(false)} 
        title={debtForm.id ? "Editar Deuda" : "Nueva Deuda"}
      >
        <form onSubmit={handleSaveDebt} style={{ display: "grid", gap: "1rem" }}>
          <Input 
            label="Nombre de la Deuda" 
            required 
            placeholder="Ej: Préstamo Coche"
            value={debtForm.name}
            onChange={(e) => setDebtForm({...debtForm, name: e.target.value})}
          />
          <Input 
            label="Acreedor (Persona/Entidad)" 
            placeholder="Ej: Banco Santander"
            value={debtForm.creditor}
            onChange={(e) => setDebtForm({...debtForm, creditor: e.target.value})}
          />
          <Input 
            label={`Importe Total (${formatCurrency(0).replace("0,00", "").trim()})`} 
            type="number" 
            step="0.01" 
            required 
            value={debtForm.totalAmount}
            onChange={(e) => setDebtForm({...debtForm, totalAmount: e.target.value})}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <Input 
              label="Fecha Inicio" 
              type="date" 
              value={debtForm.startDate}
              onChange={(e) => setDebtForm({...debtForm, startDate: e.target.value})}
            />
            <Input 
              label="Fecha Límite (Opcional)" 
              type="date" 
              value={debtForm.dueDate}
              onChange={(e) => setDebtForm({...debtForm, dueDate: e.target.value})}
            />
          </div>
          <Input 
            label="Descripción" 
            placeholder="Detalles adicionales..."
            value={debtForm.description}
            onChange={(e) => setDebtForm({...debtForm, description: e.target.value})}
          />
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
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>Deuda: <strong>{selectedDebt?.name}</strong></p>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>Pendiente: <strong style={{ color: "var(--color-danger)" }}>{selectedDebt && formatCurrency(selectedDebt.remaining)}</strong></p>
        </div>

        <form onSubmit={handleAddPayment} style={{ display: "grid", gap: "1rem" }}>
          <Input 
            label={`Importe Pagado (${formatCurrency(0).replace("0,00", "").trim()})`} 
            type="number" 
            step="0.01" 
            required 
            max={selectedDebt?.remaining} // Opcional: limitar al restante
            value={paymentForm.amount}
            onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
          />
          <Input 
            label="Fecha del Pago" 
            type="date" 
            required 
            value={paymentForm.date}
            onChange={(e) => setPaymentForm({...paymentForm, date: e.target.value})}
          />
          <Input 
            label="Nota (Opcional)" 
            placeholder="Transferencia #123..."
            value={paymentForm.note}
            onChange={(e) => setPaymentForm({...paymentForm, note: e.target.value})}
          />
          
          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            <Button type="button" variant="ghost" onClick={() => setIsPaymentModalOpen(false)} style={{ flex: 1 }}>Cancelar</Button>
            <Button type="submit" style={{ flex: 1 }}>Confirmar Pago</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
