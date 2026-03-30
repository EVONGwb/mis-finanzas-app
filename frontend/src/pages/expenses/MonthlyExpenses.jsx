import { useState, useEffect } from "react";
import { apiFetch } from "../../lib/api";
import { getToken } from "../../lib/auth";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Table, TableRow, TableCell } from "../../components/ui/Table";
import { Modal } from "../../components/ui/Modal";
import { Badge } from "../../components/ui/Badge";
import { useCurrency } from "../../context/CurrencyContext";
import { Plus, CheckCircle, Clock, Trash2, Edit2 } from "lucide-react";

export default function MonthlyExpenses({ month, year, onUpdate }) {
  const { formatCurrency } = useCurrency();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Template Management
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    id: null,
    name: "",
    category: "mensual",
    defaultAmount: "",
    dueDay: 1,
    isVariable: false
  });

  // Confirmation Logic
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [confirmAmount, setConfirmAmount] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/monthly-expenses/status?month=${month}&year=${year}`, { token: getToken() });
      setExpenses(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [month, year]);

  // --- Template Actions ---
  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    try {
      const isEdit = !!templateForm.id;
      const url = isEdit ? `/monthly-expenses/templates/${templateForm.id}` : "/monthly-expenses/templates";
      const method = isEdit ? "PATCH" : "POST";
      
      await apiFetch(url, {
        method,
        token: getToken(),
        body: {
          name: templateForm.name,
          category: templateForm.category,
          defaultAmount: Number(templateForm.defaultAmount),
          dueDay: Number(templateForm.dueDay),
          isVariable: templateForm.isVariable
        }
      });
      
      setIsTemplateModalOpen(false);
      resetTemplateForm();
      fetchData();
      if (onUpdate) onUpdate();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDeleteTemplate = async (id) => {
    // Eliminar confirmación directa
    try {
      await apiFetch(`/monthly-expenses/templates/${id}`, { method: "DELETE", token: getToken() });
      fetchData();
      if (onUpdate) onUpdate();
    } catch (e) {
      alert(e.message);
    }
  };

  const resetTemplateForm = () => {
    setTemplateForm({ id: null, name: "", category: "mensual", defaultAmount: "", dueDay: 1, isVariable: false });
  };

  const openEditTemplate = (item) => {
    setTemplateForm({
      id: item.templateId,
      name: item.name,
      category: item.category,
      defaultAmount: item.defaultAmount,
      dueDay: item.dueDay,
      isVariable: item.isVariable
    });
    setIsTemplateModalOpen(true);
  };

  // --- Confirmation Actions ---
  const handleClickConfirm = (item) => {
    setSelectedExpense(item);
    setConfirmAmount(item.defaultAmount); // Pre-fill with default
    
    if (item.isVariable) {
      setConfirmModalOpen(true); // Open modal to edit amount
    } else {
      // Direct confirm if fixed
      if (window.confirm(`¿Confirmar pago de ${item.name} por $${item.defaultAmount}?`)) {
        executeConfirm(item.templateId, item.defaultAmount);
      }
    }
  };

  const executeConfirm = async (templateId, amount) => {
    try {
      await apiFetch("/monthly-expenses/confirm", {
        method: "POST",
        token: getToken(),
        body: { templateId, month, year, amount }
      });
      setConfirmModalOpen(false);
      fetchData();
      if (onUpdate) onUpdate();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleRevoke = async (instanceId) => {
    if (!window.confirm("¿Cancelar pago? Se devolverá el dinero al Banco.")) return;
    try {
      await apiFetch(`/monthly-expenses/revoke/${instanceId}`, { method: "DELETE", token: getToken() });
      fetchData();
      if (onUpdate) onUpdate();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
        <Button onClick={() => { resetTemplateForm(); setIsTemplateModalOpen(true); }} variant="danger">
          <Plus size={16} style={{ marginRight: "0.5rem" }} /> Nueva Plantilla
        </Button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-secondary)" }}>Cargando...</div>
        ) : expenses.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-secondary)" }}>
            No hay gastos mensuales configurados. Crea una plantilla.
          </div>
        ) : (
          expenses.map(item => (
            <Card key={item.templateId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", borderLeft: item.status === "confirmed" ? "4px solid var(--color-success)" : "4px solid var(--color-warning)" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                  <span style={{ fontWeight: 600, fontSize: "1rem" }}>{item.name}</span>
                  {item.isVariable && <Badge variant="outline">Variable</Badge>}
                </div>
                <div style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
                  Día {item.dueDay} • {item.category}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: "bold", fontSize: "1.1rem", color: item.status === "confirmed" ? "var(--color-success)" : "var(--color-text)" }}>
                    {formatCurrency(item.amount)}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: item.status === "confirmed" ? "var(--color-success)" : "var(--color-warning)" }}>
                    {item.status === "confirmed" ? "Pagado ✅" : "Pendiente ⏳"}
                  </div>
                </div>

                {item.status === "pending" ? (
                  <Button size="sm" variant="outline" onClick={() => handleClickConfirm(item)} style={{ borderColor: "var(--color-success)", color: "var(--color-success)" }}>
                    Confirmar
                  </Button>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => handleRevoke(item.instanceId)} style={{ color: "var(--color-text-secondary)" }} title="Deshacer pago">
                    ↩
                  </Button>
                )}
                
                {/* Edit & Delete Template Buttons */}
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button onClick={() => openEditTemplate(item)} style={{ background: "none", border: "none", cursor: "pointer", opacity: 0.5 }} title="Editar">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDeleteTemplate(item.templateId)} style={{ background: "none", border: "none", cursor: "pointer", opacity: 0.5, color: "var(--color-danger)" }} title="Eliminar sin confirmar">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Modal: Template Form */}
      <Modal isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)} title={templateForm.id ? "Editar Plantilla" : "Nueva Plantilla Mensual"}>
        <form onSubmit={handleSaveTemplate} style={{ display: "grid", gap: "1rem" }}>
          <Input label="Nombre del Gasto" value={templateForm.name} onChange={(e) => setTemplateForm({...templateForm, name: e.target.value})} required placeholder="Ej: Alquiler" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <Input label="Importe Base ($)" type="number" value={templateForm.defaultAmount} onChange={(e) => setTemplateForm({...templateForm, defaultAmount: e.target.value})} required />
            <Input label="Día de Cobro" type="number" min="1" max="31" value={templateForm.dueDay} onChange={(e) => setTemplateForm({...templateForm, dueDay: e.target.value})} required />
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <input type="checkbox" checked={templateForm.isVariable} onChange={(e) => setTemplateForm({...templateForm, isVariable: e.target.checked})} id="isVariable" />
            <label htmlFor="isVariable" style={{ fontSize: "0.875rem" }}>Es importe variable (confirmar cada mes)</label>
          </div>
          
          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            {templateForm.id && (
              <Button type="button" variant="ghost" onClick={() => handleDeleteTemplate(templateForm.id)} style={{ color: "var(--color-danger)" }}>Eliminar</Button>
            )}
            <div style={{ flex: 1 }}></div>
            <Button type="button" variant="ghost" onClick={() => setIsTemplateModalOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="danger">Guardar</Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Confirm Variable Amount */}
      <Modal isOpen={confirmModalOpen} onClose={() => setConfirmModalOpen(false)} title={`Confirmar ${selectedExpense?.name}`}>
        <div style={{ display: "grid", gap: "1rem" }}>
          <p style={{ color: "var(--color-text-secondary)" }}>Este es un gasto variable. Confirma el importe exacto para este mes.</p>
          <Input 
            label={`Importe Real (${formatCurrency(0).replace("0,00", "").trim()})`} 
            type="number" 
            value={confirmAmount} 
            onChange={(e) => setConfirmAmount(e.target.value)} 
            autoFocus
          />
          <Button onClick={() => executeConfirm(selectedExpense.templateId, confirmAmount)} variant="success" style={{ width: "100%" }}>
            Confirmar y Descontar
          </Button>
        </div>
      </Modal>
    </div>
  );
}
