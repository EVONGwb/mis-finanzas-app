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
  const [viewType, setViewType] = useState("monthly"); // "monthly" or "daily"

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    amount: "",
    category: "general",
    concept: "",
    paymentMethod: "cash",
    type: "monthly" // Default to monthly on create, but user can change
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
    const matchesDate = d.getMonth() + 1 === parseInt(month) && d.getFullYear() === parseInt(year);
    // If item.type is missing, treat as "daily" for backward compatibility or "monthly" depending on your preference.
    // Let's assume default is "daily" if undefined, or check if it matches viewType.
    const itemType = item.type || "daily"; 
    return matchesDate && itemType === viewType;
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

      {/* View Type Toggles */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
        <button
          onClick={() => setViewType("monthly")}
          style={{
            flex: 1,
            padding: "1rem",
            backgroundColor: viewType === "monthly" ? "var(--color-danger)" : "var(--color-surface)",
            color: viewType === "monthly" ? "white" : "var(--color-text)",
            border: viewType === "monthly" ? "none" : "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s",
            textAlign: "center",
            boxShadow: viewType === "monthly" ? "var(--shadow-md)" : "none"
          }}
        >
          Gastos Mensuales
          <span style={{ display: "block", fontSize: "0.75rem", fontWeight: 400, opacity: 0.9, marginTop: "0.25rem" }}>
            Fijos (Alquiler, Luz, Internet...)
          </span>
        </button>
        <button
          onClick={() => setViewType("daily")}
          style={{
            flex: 1,
            padding: "1rem",
            backgroundColor: viewType === "daily" ? "var(--color-warning)" : "var(--color-surface)",
            color: viewType === "daily" ? "white" : "var(--color-text)",
            border: viewType === "daily" ? "none" : "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s",
            textAlign: "center",
            boxShadow: viewType === "daily" ? "var(--shadow-md)" : "none"
          }}
        >
          Gastos Diarios
          <span style={{ display: "block", fontSize: "0.75rem", fontWeight: 400, opacity: 0.9, marginTop: "0.25rem" }}>
            Variables (Café, Cine, Compras...)
          </span>
        </button>
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
            <label style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--color-text-secondary)" }}>Tipo de Gasto</label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: "monthly" })}
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  borderRadius: "var(--radius-sm)",
                  border: formData.type === "monthly" ? "2px solid var(--color-danger)" : "1px solid var(--color-border)",
                  backgroundColor: formData.type === "monthly" ? "var(--color-danger-bg)" : "var(--color-surface)",
                  color: formData.type === "monthly" ? "var(--color-danger)" : "var(--color-text)",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Mensual (Fijo)
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: "daily" })}
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  borderRadius: "var(--radius-sm)",
                  border: formData.type === "daily" ? "2px solid var(--color-warning)" : "1px solid var(--color-border)",
                  backgroundColor: formData.type === "daily" ? "var(--color-warning-bg)" : "var(--color-surface)",
                  color: formData.type === "daily" ? "var(--color-warning)" : "var(--color-text)",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Diario (Variable)
              </button>
            </div>
          </div>

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
