import { useState, useEffect } from "react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { Plus, Target, Trophy, TrendingUp, Trash2, Edit2 } from "lucide-react";

export default function Goals() {
  const [goals, setGoals] = useState(() => {
    const saved = localStorage.getItem("goals");
    return saved ? JSON.parse(saved) : [];
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ id: null, title: "", target: "", current: "", deadline: "" });

  useEffect(() => {
    localStorage.setItem("goals", JSON.stringify(goals));
  }, [goals]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.id) {
      setGoals(goals.map(g => g.id === form.id ? { ...form, target: parseFloat(form.target), current: parseFloat(form.current) } : g));
    } else {
      setGoals([...goals, { ...form, id: Date.now(), target: parseFloat(form.target), current: parseFloat(form.current) }]);
    }
    setIsModalOpen(false);
    setForm({ id: null, title: "", target: "", current: "", deadline: "" });
  };

  const handleDelete = (id) => {
    if (window.confirm("¿Eliminar objetivo?")) {
      setGoals(goals.filter(g => g.id !== id));
    }
  };

  const handleEdit = (goal) => {
    setForm(goal);
    setIsModalOpen(true);
  };

  const getProgress = (current, target) => Math.min(100, Math.round((current / target) * 100));

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Target className="text-primary" /> Objetivos
          </h1>
          <p style={{ color: "var(--color-text-secondary)" }}>Define y alcanza tus metas financieras</p>
        </div>
        <Button onClick={() => { setForm({ id: null, title: "", target: "", current: "", deadline: "" }); setIsModalOpen(true); }} variant="primary">
          <Plus size={18} /> Nuevo Objetivo
        </Button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}>
        {goals.length === 0 && (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "3rem", color: "var(--color-text-secondary)" }}>
            <Trophy size={48} style={{ marginBottom: "1rem", opacity: 0.2 }} />
            <p>No tienes objetivos activos. ¡Crea uno para empezar!</p>
          </div>
        )}
        
        {goals.map(goal => {
          const progress = getProgress(goal.current, goal.target);
          return (
            <Card key={goal.id} style={{ position: "relative", overflow: "hidden" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: "bold" }}>{goal.title}</h3>
                  <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
                    Meta: {new Date(goal.deadline).toLocaleDateString()}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button onClick={() => handleEdit(goal)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-secondary)" }}><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(goal.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-danger)" }}><Trash2 size={16} /></button>
                </div>
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: 600 }}>
                  <span>${goal.current.toLocaleString()}</span>
                  <span>${goal.target.toLocaleString()}</span>
                </div>
                <div style={{ width: "100%", height: "10px", backgroundColor: "var(--color-surface-hover)", borderRadius: "5px", overflow: "hidden" }}>
                  <div style={{ 
                    width: `${progress}%`, 
                    height: "100%", 
                    backgroundColor: progress >= 100 ? "var(--color-success)" : "var(--color-primary)",
                    transition: "width 0.5s ease-out" 
                  }} />
                </div>
                <div style={{ textAlign: "right", fontSize: "0.75rem", marginTop: "0.25rem", color: progress >= 100 ? "var(--color-success)" : "var(--color-primary)" }}>
                  {progress}% completado
                </div>
              </div>

              {progress >= 100 && (
                <div style={{ 
                  position: "absolute", top: 0, right: 0, 
                  backgroundColor: "var(--color-success)", color: "white", 
                  padding: "0.25rem 0.75rem", borderBottomLeftRadius: "var(--radius-md)",
                  fontSize: "0.75rem", fontWeight: "bold"
                }}>
                  ¡CONSEGUIDO!
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={form.id ? "Editar Objetivo" : "Nuevo Objetivo"}>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
          <Input label="Título" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Ej. Viaje a Japón" required />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <Input label="Meta ($)" type="number" value={form.target} onChange={e => setForm({...form, target: e.target.value})} placeholder="5000" required />
            <Input label="Ahorrado ($)" type="number" value={form.current} onChange={e => setForm({...form, current: e.target.value})} placeholder="0" required />
          </div>
          <Input label="Fecha Límite" type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} required />
          <Button type="submit" variant="primary">{form.id ? "Actualizar" : "Crear Objetivo"}</Button>
        </form>
      </Modal>
    </div>
  );
}
