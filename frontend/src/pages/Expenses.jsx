import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { getToken } from "../lib/auth";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Table, TableRow, TableCell } from "../components/ui/Table";
import { Modal } from "../components/ui/Modal";
import { Badge } from "../components/ui/Badge";
import { Plus, Filter, Trash2 } from "lucide-react";

export default function Expenses() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    amount: "",
    category: "general",
    concept: "",
    paymentMethod: "cash"
  });

  // Filter state
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const fetchItems = async () => {
    setLoading(true);
    try {
      setError("");
      const res = await apiFetch("/expenses", { token: getToken() });
      setItems(res.data);
    } catch (e) {
      setError(e.message || "Error API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

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
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar este gasto?")) return;
    
    setDeletingId(id);
    try {
      await apiFetch(`/expenses/${id}`, {
        method: "DELETE",
        token: getToken()
      });
      // Remove from UI immediately
      setItems(items.filter(item => item._id !== id));
    } catch (e) {
      alert(e.message || "Error al eliminar");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredItems = items.filter(item => {
    const d = new Date(item.date);
    return d.getMonth() + 1 === parseInt(month) && d.getFullYear() === parseInt(year);
  });

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.875rem" }}>Gastos</h1>
          <p style={{ color: "var(--color-text-secondary)" }}>Controla en qué se va tu dinero</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} variant="danger">
          <Plus size={18} /> Nuevo Gasto
        </Button>
      </div>

      {error && (
        <div style={{ marginBottom: "1rem", padding: "1rem", color: "var(--color-danger)", backgroundColor: "var(--color-danger-bg)", borderRadius: "var(--radius-md)" }}>
          {error}
        </div>
      )}

      <Card style={{ marginBottom: "2rem" }} padding="1rem">
        <div style={{ display: "flex", gap: "1rem", alignItems: "center", width: "100%" }}>
          <Filter size={18} color="var(--color-text-secondary)" />
          <select 
            value={month} 
            onChange={(e) => setMonth(e.target.value)}
            style={{ 
              padding: "0.5rem", 
              borderRadius: "var(--radius-sm)", 
              border: "1px solid var(--color-border)",
              flex: 1
            }}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('es-ES', { month: 'long' })}</option>
            ))}
          </select>
          <select 
            value={year} 
            onChange={(e) => setYear(e.target.value)}
            style={{ 
              padding: "0.5rem", 
              borderRadius: "var(--radius-sm)", 
              border: "1px solid var(--color-border)",
              flex: 1
            }}
          >
            <option value="2024">2024</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>
        </div>
      </Card>

      <Card padding="0">
        <Table headers={["Fecha", "Concepto", "Categoría", "Método", "Monto", "Acciones"]}>
          {loading ? (
            <TableRow><TableCell>Cargando...</TableCell></TableRow>
          ) : filteredItems.length === 0 ? (
            <TableRow><TableCell className="text-secondary">No hay gastos en este periodo</TableCell></TableRow>
          ) : (
            filteredItems.map(item => (
              <TableRow key={item._id}>
                <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                <TableCell>{item.concept || "-"}</TableCell>
                <TableCell><Badge variant="default">{item.category}</Badge></TableCell>
                <TableCell>{item.paymentMethod}</TableCell>
                <TableCell className="font-bold text-danger">-${item.amount.toLocaleString()}</TableCell>
                <TableCell>
                  <button 
                    onClick={() => handleDelete(item._id)}
                    disabled={deletingId === item._id}
                    style={{ 
                      background: "none", 
                      border: "none", 
                      cursor: deletingId === item._id ? "wait" : "pointer", 
                      color: "var(--color-danger)",
                      opacity: deletingId === item._id ? 0.5 : 1,
                      padding: "0.25rem"
                    }}
                    title="Eliminar gasto"
                  >
                    <Trash2 size={18} />
                  </button>
                </TableCell>
              </TableRow>
            ))
          )}
        </Table>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nuevo Gasto">
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
          <Input 
            label="Fecha" 
            type="date" 
            value={formData.date} 
            onChange={(e) => setFormData({...formData, date: e.target.value})}
            required
          />
          <Input 
            label="Monto" 
            type="number" 
            value={formData.amount} 
            onChange={(e) => setFormData({...formData, amount: e.target.value})}
            placeholder="0.00"
            required
          />
          <Input 
            label="Concepto" 
            value={formData.concept} 
            onChange={(e) => setFormData({...formData, concept: e.target.value})}
            placeholder="Ej. Compras supermercado"
          />
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--color-text-secondary)" }}>Categoría</label>
            <select 
              value={formData.category} 
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              style={{ padding: "0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", width: "100%" }}
            >
              <option value="general">General</option>
              <option value="food">Comida</option>
              <option value="transport">Transporte</option>
              <option value="health">Salud</option>
              <option value="leisure">Ocio</option>
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--color-text-secondary)" }}>Método de pago</label>
            <select 
              value={formData.paymentMethod} 
              onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
              style={{ padding: "0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", width: "100%" }}
            >
              <option value="cash">Efectivo</option>
              <option value="card">Tarjeta</option>
              <option value="transfer">Transferencia</option>
            </select>
          </div>
          <Button type="button" variant="danger" onClick={handleSubmit} style={{ marginTop: "1rem" }}>Guardar Gasto</Button>
        </form>
      </Modal>
    </div>
  );
}
