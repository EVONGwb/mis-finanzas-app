import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { getToken } from "../lib/auth";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Table, TableRow, TableCell } from "../components/ui/Table";
import { Modal } from "../components/ui/Modal";
import { Badge } from "../components/ui/Badge";
import { Plus, Filter } from "lucide-react";

export default function Incomes() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    amount: "",
    category: "salary",
    concept: "",
    source: ""
  });

  // Filter state
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const fetchItems = async () => {
    setLoading(true);
    try {
      setError("");
      const res = await apiFetch("/incomes", { token: getToken() });
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
      await apiFetch("/incomes", {
        method: "POST",
        token: getToken(),
        body: formData
      });
      setIsModalOpen(false);
      setFormData({ ...formData, amount: "", concept: "", source: "" });
      fetchItems();
    } catch (e) {
      alert(e.message);
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
          <h1 style={{ fontSize: "1.875rem" }}>Ingresos</h1>
          <p style={{ color: "var(--color-text-secondary)" }}>Registro detallado de tus ingresos</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Nuevo Ingreso
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
              flex: 1 // Take available space
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
              flex: 1 // Take available space
            }}
          >
            <option value="2024">2024</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>
        </div>
      </Card>

      <Card padding="0">
        <Table headers={["Fecha", "Concepto", "Categoría", "Monto"]}>
          {loading ? (
            <TableRow><TableCell>Cargando...</TableCell></TableRow>
          ) : filteredItems.length === 0 ? (
            <TableRow><TableCell className="text-secondary">No hay ingresos en este periodo</TableCell></TableRow>
          ) : (
            filteredItems.map(item => (
              <TableRow key={item._id}>
                <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                <TableCell>{item.concept || "-"}</TableCell>
                <TableCell><Badge variant="success">{item.category}</Badge></TableCell>
                <TableCell className="font-bold text-success">+${item.amount.toLocaleString()}</TableCell>
              </TableRow>
            ))
          )}
        </Table>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nuevo Ingreso">
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
            placeholder="Ej. Nómina"
          />
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--color-text-secondary)" }}>Categoría</label>
            <select 
              value={formData.category} 
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              style={{ padding: "0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", width: "100%" }}
            >
              <option value="salary">Salario</option>
              <option value="business">Negocio</option>
              <option value="investment">Inversión</option>
              <option value="other">Otro</option>
            </select>
          </div>
          <Button type="submit" style={{ marginTop: "1rem" }}>Guardar Ingreso</Button>
        </form>
      </Modal>
    </div>
  );
}
