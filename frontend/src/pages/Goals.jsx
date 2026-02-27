import { useState, useEffect } from "react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { useCurrency } from "../context/CurrencyContext";
import { 
  Plus, 
  Target, 
  Trophy, 
  Trash2, 
  Edit2, 
  Plane, 
  Car, 
  Home, 
  Smartphone, 
  Gift, 
  Briefcase,
  PiggyBank,
  TrendingUp 
} from "lucide-react";

// Icon selector component
const IconSelector = ({ selected, onSelect }) => {
  const icons = [
    { id: "general", icon: Target, label: "General" },
    { id: "travel", icon: Plane, label: "Viaje" },
    { id: "car", icon: Car, label: "Coche" },
    { id: "home", icon: Home, label: "Casa" },
    { id: "tech", icon: Smartphone, label: "Tecnología" },
    { id: "gift", icon: Gift, label: "Regalo" },
    { id: "business", icon: Briefcase, label: "Negocio" },
    { id: "savings", icon: PiggyBank, label: "Ahorro" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem" }}>
      {icons.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.id}
            onClick={() => onSelect(item.id)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "0.5rem",
              borderRadius: "var(--radius-md)",
              border: selected === item.id ? "2px solid var(--color-primary)" : "1px solid var(--color-border)",
              backgroundColor: selected === item.id ? "var(--color-primary-light)" : "var(--color-surface)",
              color: selected === item.id ? "var(--color-primary)" : "var(--color-text)",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            <Icon size={20} />
            <span style={{ fontSize: "0.7rem", marginTop: "0.25rem" }}>{item.label}</span>
          </div>
        );
      })}
    </div>
  );
};

export default function Goals() {
  const { formatCurrency } = useCurrency();
  const [goals, setGoals] = useState(() => {
    const saved = localStorage.getItem("goals");
    return saved ? JSON.parse(saved) : [];
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  
  const [form, setForm] = useState({ 
    id: null, 
    title: "", 
    target: "", 
    current: "", 
    deadline: "", 
    icon: "general" 
  });
  
  const [depositForm, setDepositForm] = useState({
    goalId: null,
    amount: ""
  });

  useEffect(() => {
    localStorage.setItem("goals", JSON.stringify(goals));
  }, [goals]);

  // Goal Management
  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.id) {
      setGoals(goals.map(g => g.id === form.id ? { ...form, target: parseFloat(form.target), current: parseFloat(form.current) } : g));
    } else {
      setGoals([...goals, { ...form, id: Date.now(), target: parseFloat(form.target), current: parseFloat(form.current) }]);
    }
    setIsModalOpen(false);
    resetForm();
  };

  const handleDelete = (id) => {
    // Confirmation disabled as requested
    setGoals(goals.filter(g => g.id !== id));
  };

  const handleEdit = (goal) => {
    setForm(goal);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setForm({ id: null, title: "", target: "", current: "", deadline: "", icon: "general" });
  };

  // Deposit Management
  const openDepositModal = (goal) => {
    setDepositForm({ goalId: goal.id, amount: "" });
    setIsDepositModalOpen(true);
  };

  const handleDeposit = (e) => {
    e.preventDefault();
    const amount = parseFloat(depositForm.amount);
    if (isNaN(amount) || amount <= 0) return;

    setGoals(goals.map(g => {
      if (g.id === depositForm.goalId) {
        return { ...g, current: g.current + amount };
      }
      return g;
    }));
    
    setIsDepositModalOpen(false);
    setDepositForm({ goalId: null, amount: "" });
  };

  // UI Helpers
  const getProgress = (current, target) => Math.min(100, Math.round((current / target) * 100));
  
  const getIcon = (iconId) => {
    switch(iconId) {
      case "travel": return Plane;
      case "car": return Car;
      case "home": return Home;
      case "tech": return Smartphone;
      case "gift": return Gift;
      case "business": return Briefcase;
      case "savings": return PiggyBank;
      default: return Target;
    }
  };

  const getDaysLeft = (deadline) => {
    if (!deadline) return null;
    const today = new Date();
    const end = new Date(deadline);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: "5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Target className="text-primary" /> Objetivos
          </h1>
          <p style={{ color: "var(--color-text-secondary)" }}>Tus metas financieras</p>
        </div>
        <Button onClick={() => { resetForm(); setIsModalOpen(true); }} variant="primary">
          <Plus size={18} /> Nuevo
        </Button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}>
        {goals.length === 0 && (
          <div style={{ 
            gridColumn: "1/-1", 
            display: "flex", 
            flexDirection: "column", 
            alignItems: "center", 
            justifyContent: "center", 
            padding: "4rem 2rem", 
            backgroundColor: "var(--color-surface)", 
            borderRadius: "var(--radius-lg)", 
            border: "1px dashed var(--color-border)",
            color: "var(--color-text-secondary)",
            textAlign: "center"
          }}>
            <div style={{ 
              width: "80px", height: "80px", 
              backgroundColor: "var(--color-surface-hover)", 
              borderRadius: "50%", 
              display: "flex", alignItems: "center", justifyContent: "center", 
              marginBottom: "1.5rem" 
            }}>
              <Trophy size={40} style={{ opacity: 0.5 }} />
            </div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.5rem", color: "var(--color-text)" }}>Sin objetivos aún</h3>
            <p style={{ maxWidth: "300px", marginBottom: "1.5rem" }}>Establece una meta de ahorro para ese viaje, coche o capricho que deseas.</p>
            <Button onClick={() => { resetForm(); setIsModalOpen(true); }} variant="primary">
              Crear mi primer objetivo
            </Button>
          </div>
        )}
        
        {goals.map(goal => {
          const progress = getProgress(goal.current, goal.target);
          const GoalIcon = getIcon(goal.icon || "general");
          const daysLeft = getDaysLeft(goal.deadline);
          const isCompleted = progress >= 100;

          return (
            <Card key={goal.id} style={{ 
              position: "relative", 
              overflow: "hidden", 
              display: "flex", 
              flexDirection: "column",
              border: isCompleted ? "2px solid var(--color-success)" : "1px solid var(--color-border)"
            }}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                  <div style={{ 
                    width: "48px", height: "48px", 
                    backgroundColor: isCompleted ? "var(--color-success-bg)" : "var(--color-primary-light)", 
                    borderRadius: "12px", 
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: isCompleted ? "var(--color-success)" : "var(--color-primary)"
                  }}>
                    {isCompleted ? <Trophy size={24} /> : <GoalIcon size={24} />}
                  </div>
                  <div>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: "bold" }}>{goal.title}</h3>
                    <p style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>
                      {isCompleted ? "¡Meta alcanzada!" : daysLeft !== null ? `${daysLeft} días restantes` : "Sin fecha límite"}
                    </p>
                  </div>
                </div>
                
                <div style={{ display: "flex", gap: "0.25rem" }}>
                  <button 
                    onClick={() => handleEdit(goal)} 
                    style={{ 
                      padding: "0.5rem", 
                      borderRadius: "var(--radius-md)", 
                      background: "transparent", 
                      border: "none", 
                      cursor: "pointer", 
                      color: "var(--color-text-secondary)" 
                    }}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(goal.id)} 
                    style={{ 
                      padding: "0.5rem", 
                      borderRadius: "var(--radius-md)", 
                      background: "transparent", 
                      border: "none", 
                      cursor: "pointer", 
                      color: "var(--color-danger)" 
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Progress Circle & Stats */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "0.5rem" }}>
                  <div>
                    <span style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", display: "block" }}>Ahorrado</span>
                    <span style={{ fontSize: "1.5rem", fontWeight: "bold", color: isCompleted ? "var(--color-success)" : "var(--color-text)" }}>
                      {formatCurrency(goal.current)}
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", display: "block" }}>Objetivo</span>
                    <span style={{ fontSize: "1rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>
                      {formatCurrency(goal.target)}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div style={{ position: "relative", height: "12px", backgroundColor: "var(--color-surface-hover)", borderRadius: "99px", overflow: "hidden" }}>
                  <div style={{ 
                    width: `${progress}%`, 
                    height: "100%", 
                    backgroundColor: isCompleted ? "var(--color-success)" : "var(--color-primary)",
                    borderRadius: "99px",
                    transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)" 
                  }} />
                </div>
                <div style={{ textAlign: "right", fontSize: "0.8rem", marginTop: "0.5rem", fontWeight: 600, color: isCompleted ? "var(--color-success)" : "var(--color-primary)" }}>
                  {progress}% completado
                </div>
              </div>

              {/* Action Button */}
              {!isCompleted && (
                <Button 
                  onClick={() => openDepositModal(goal)} 
                  variant="outline" 
                  style={{ width: "100%", borderStyle: "dashed", borderColor: "var(--color-primary)", color: "var(--color-primary)" }}
                >
                  <TrendingUp size={16} style={{ marginRight: "0.5rem" }} /> Añadir Ahorro
                </Button>
              )}
              
              {isCompleted && (
                <div style={{ 
                  textAlign: "center", 
                  padding: "0.75rem", 
                  backgroundColor: "var(--color-success-bg)", 
                  color: "var(--color-success)", 
                  borderRadius: "var(--radius-md)",
                  fontWeight: 600,
                  fontSize: "0.9rem"
                }}>
                  ¡Objetivo Completado! 🎉
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Modal: Create/Edit Goal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={form.id ? "Editar Objetivo" : "Nuevo Objetivo"}>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
          <Input 
            label="Título" 
            value={form.title} 
            onChange={e => setForm({...form, title: e.target.value})} 
            placeholder="Ej. Viaje a Japón" 
            required 
          />
          
          <div>
            <label style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: "0.5rem", display: "block" }}>Icono</label>
            <IconSelector selected={form.icon || "general"} onSelect={(id) => setForm({...form, icon: id})} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <Input 
              label={`Meta (${formatCurrency(0).replace("0,00", "").trim()})`} 
              type="number" 
              value={form.target} 
              onChange={e => setForm({...form, target: e.target.value})} 
              placeholder="5000" 
              required 
            />
            <Input 
              label={`Ahorrado Inicial (${formatCurrency(0).replace("0,00", "").trim()})`} 
              type="number" 
              value={form.current} 
              onChange={e => setForm({...form, current: e.target.value})} 
              placeholder="0" 
              required 
            />
          </div>
          
          <Input 
            label="Fecha Límite (Opcional)" 
            type="date" 
            value={form.deadline} 
            onChange={e => setForm({...form, deadline: e.target.value})} 
          />
          
          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} style={{ flex: 1 }}>Cancelar</Button>
            <Button type="submit" variant="primary" style={{ flex: 1 }}>{form.id ? "Guardar Cambios" : "Crear Objetivo"}</Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Deposit */}
      <Modal isOpen={isDepositModalOpen} onClose={() => setIsDepositModalOpen(false)} title="Añadir Ahorro">
        <form onSubmit={handleDeposit} style={{ display: "grid", gap: "1rem" }}>
          <div style={{ textAlign: "center", marginBottom: "1rem" }}>
            <div style={{ fontSize: "3rem", fontWeight: "bold", color: "var(--color-primary)" }}>
              {formatCurrency(depositForm.amount || 0)}
            </div>
            <p style={{ color: "var(--color-text-secondary)" }}>¿Cuánto vas a ahorrar hoy?</p>
          </div>
          
          <Input 
            label="Cantidad a ingresar" 
            type="number" 
            autoFocus
            value={depositForm.amount} 
            onChange={e => setDepositForm({...depositForm, amount: e.target.value})} 
            placeholder="0.00" 
            required 
          />
          
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
            {[10, 20, 50, 100].map(val => (
              <button
                key={val}
                type="button"
                onClick={() => setDepositForm({...depositForm, amount: val.toString()})}
                style={{
                  flex: 1,
                  padding: "0.5rem",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--color-surface)",
                  cursor: "pointer",
                  fontSize: "0.9rem"
                }}
              >
                +{formatCurrency(val)}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            <Button type="button" variant="ghost" onClick={() => setIsDepositModalOpen(false)} style={{ flex: 1 }}>Cancelar</Button>
            <Button type="submit" variant="primary" style={{ flex: 1 }}>Confirmar Ahorro</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}