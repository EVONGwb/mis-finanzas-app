import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";
import { getToken } from "../../lib/auth";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { Table, TableRow, TableCell } from "../../components/ui/Table";
import { Plus, Trash2, Edit2, Key } from "lucide-react";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Create User Form
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user"
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/admin/users", { token: getToken() });
      setUsers(res.data);
    } catch (e) {
      setError(e.message || "Error cargando usuarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiFetch("/admin/users", {
        method: "POST",
        token: getToken(),
        body: formData
      });
      setIsModalOpen(false);
      setFormData({ name: "", email: "", password: "", role: "user" });
      fetchUsers();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleChangeRole = async (userId, currentRole) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    if (!window.confirm(`¿Cambiar rol a ${newRole}?`)) return;
    
    try {
      await apiFetch(`/admin/users/${userId}/role`, {
        method: "PATCH",
        token: getToken(),
        body: { role: newRole }
      });
      fetchUsers();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleResetPassword = async (userId) => {
    const newPassword = prompt("Introduce nueva contraseña (mínimo 6 caracteres):");
    if (!newPassword) return;

    try {
      await apiFetch(`/admin/users/${userId}/password`, {
        method: "PATCH",
        token: getToken(),
        body: { password: newPassword }
      });
      alert("Contraseña actualizada");
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("¿Estás seguro de eliminar este usuario?")) return;
    try {
      await apiFetch(`/admin/users/${userId}`, {
        method: "DELETE",
        token: getToken()
      });
      fetchUsers();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.875rem" }}>Gestión de Usuarios</h1>
          <p style={{ color: "var(--color-text-secondary)" }}>Administración del sistema</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={18} style={{ marginRight: "0.5rem" }} />
          Nuevo Usuario
        </Button>
      </div>

      {error && <div style={{ color: "red", marginBottom: "1rem" }}>{error}</div>}

      <Card>
        {loading ? (
          <p>Cargando...</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "1rem" }}>Nombre</th>
                <th style={{ textAlign: "left", padding: "1rem" }}>Email</th>
                <th style={{ textAlign: "left", padding: "1rem" }}>Rol</th>
                <th style={{ textAlign: "right", padding: "1rem" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <TableRow key={u._id}>
                  <TableCell>{u.name || "-"}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Badge variant={u.role === "admin" ? "primary" : "neutral"}>
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleChangeRole(u._id, u.role)}
                        title="Cambiar Rol"
                      >
                        <Edit2 size={16} />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleResetPassword(u._id)}
                        title="Reset Password"
                      >
                        <Key size={16} />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleDelete(u._id)}
                        style={{ color: "var(--color-danger)" }}
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Crear Usuario">
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <Input 
            label="Nombre" 
            value={formData.name} 
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
          <Input 
            label="Email" 
            type="email" 
            required
            value={formData.email} 
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
          <Input 
            label="Contraseña" 
            type="password" 
            required
            value={formData.password} 
            onChange={(e) => setFormData({...formData, password: e.target.value})}
          />
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", marginBottom: "0.5rem" }}>Rol</label>
            <select 
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}
            >
              <option value="user">Usuario</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} style={{ flex: 1 }}>Cancelar</Button>
            <Button type="submit" style={{ flex: 1 }}>Crear</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
