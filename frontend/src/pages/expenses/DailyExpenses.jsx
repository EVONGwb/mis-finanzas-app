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
import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";

export default function DailyExpenses({ month, year, onUpdate }) {
  const { formatCurrency } = useCurrency();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    amount: "",
    category: "general",
    concept: "",
    paymentMethod: "cash",
    type: "daily"
  });

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/expenses", { token: getToken() });
      setItems(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [month, year]); // Refetch if needed, though client-side filtering is used currently

  const filteredItems = items.filter(item => {
    const d = new Date(item.date);
    const matchesDate = d.getMonth() + 1 === parseInt(month) && d.getFullYear() === parseInt(year);
    const itemType = item.type || "daily"; 
    return matchesDate && itemType === "daily";
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiFetch("/expenses", {
        method: "POST",
        token: getToken(),
        body: formData
      });
      setIsModalOpen(false);
      setFormData({ ...formData, amount: "", concept: "" });
      fetchItems();
      if (onUpdate) onUpdate();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await apiFetch(`/expenses/${id}`, {
        method: "DELETE",
        token: getToken()
      });
      setItems(items.filter(item => item._id !== id));
      if (onUpdate) onUpdate();
    } catch (e) {
      alert(e.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
        <Button onClick={() => setIsModalOpen(true)} variant="warning">
          <Plus size={16} style={{ marginRight: "0.5rem" }} /> Nuevo Gasto Diario
        </Button>
      </div>

      <Card padding="0">
        <Table headers={["Fecha", "Concepto", "Categoría", "Método", "Monto", "Acciones"]}>
          {loading ? (
            <TableRow><TableCell>Cargando...</TableCell></TableRow>
          ) : filteredItems.length === 0 ? (
            <TableRow><TableCell className="text-secondary">No hay gastos diarios en este mes</TableCell></TableRow>
          ) : (
            filteredItems.map(item => (
              <TableRow key={item._id}>
                <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                <TableCell>{item.concept || "-"}</TableCell>
                <TableCell><Badge variant="default">{item.category}</Badge></TableCell>
                <TableCell>{item.paymentMethod}</TableCell>
                <TableCell className="font-bold text-warning">-{formatCurrency(item.amount)}</TableCell>
                <TableCell>
                  <button 
                    onClick={() => handleDelete(item._id)}
                    disabled={deletingId === item._id}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-danger)" }}
                  >
                    <Trash2 size={18} />
                  </button>
                </TableCell>
              </TableRow>
            ))
          )}
        </Table>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nuevo Gasto Diario">
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
          {/* Form fields reuse from original Expenses.jsx but simplified for Daily */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--color-text-secondary)" }}>Fecha</label>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <input 
                type="date" 
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                style={{
                  width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", 
                  border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)"
                }}
                required
              />
            </div>
          </div>

          <Input 
            label="Monto" type="number" value={formData.amount} 
            onChange={(e) => setFormData({...formData, amount: e.target.value})} required placeholder="0.00"
          />
          <Input 
            label="Concepto" value={formData.concept} 
            onChange={(e) => setFormData({...formData, concept: e.target.value})} placeholder="Ej. Café"
          />
          
          {/* Categories */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--color-text-secondary)" }}>Categoría</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: "0.5rem" }}>
              {[{ id: "general", label: "General" }, { id: "food", label: "Comida" }, { id: "transport", label: "Transp." }, { id: "leisure", label: "Ocio" }].map(cat => (
                <div
                  key={cat.id}
                  onClick={() => setFormData({...formData, category: cat.id})}
                  style={{
                    padding: "0.5rem", borderRadius: "var(--radius-sm)",
                    border: formData.category === cat.id ? "2px solid var(--color-warning)" : "1px solid var(--color-border)",
                    backgroundColor: formData.category === cat.id ? "var(--color-warning-bg)" : "var(--color-surface)",
                    color: formData.category === cat.id ? "var(--color-warning)" : "var(--color-text)",
                    fontSize: "0.75rem", fontWeight: formData.category === cat.id ? 600 : 400,
                    textAlign: "center", cursor: "pointer"
                  }}
                >
                  {cat.label}
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" variant="warning" style={{ width: "100%" }}>Guardar Gasto</Button>
        </form>
      </Modal>
    </div>
  );
}
