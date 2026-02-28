import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";
import { getToken } from "../../lib/auth";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { Table, TableRow, TableCell } from "../../components/ui/Table";
import { Plus, Trash2, Edit2, Key, Search, UserCheck, UserX } from "lucide-react";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
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

  const filteredUsers = users.filter(u => 
    (u.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.875rem", fontWeight: 700, color: "#1e293b", margin: 0 }}>Gestión de Usuarios</h1>
          <p style={{ color: "#64748b", marginTop: "0.25rem" }}>Administración de cuentas y permisos</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} style={{ gap: "0.5rem" }}>
          <Plus size={18} />
          Nuevo Usuario
        </Button>
      </div>

      <Card style={{ marginBottom: "1.5rem", padding: "1rem" }}>
        <div style={{ position: "relative", maxWidth: "400px" }}>
          <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input 
            type="text" 
            placeholder="Buscar usuario..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "0.625rem 1rem 0.625rem 2.5rem",
              borderRadius: "0.5rem",
              border: "1px solid #cbd5e1",
              outline: "none",
              fontSize: "0.875rem"
            }}
          />
        </div>
      </Card>

      {error && <div style={{ color: "#ef4444", marginBottom: "1rem", padding: "1rem", backgroundColor: "#fef2f2", borderRadius: "0.5rem" }}>{error}</div>}

      <Card style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>Cargando usuarios...</div>
        ) : (
          <Table>
            <thead style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              <tr>
                <th style={{ textAlign: "left", padding: "1rem", color: "#64748b", fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase" }}>Nombre</th>
                <th style={{ textAlign: "left", padding: "1rem", color: "#64748b", fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase" }}>Email</th>
                <th style={{ textAlign: "left", padding: "1rem", color: "#64748b", fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase" }}>Rol</th>
                <th style={{ textAlign: "right", padding: "1rem", color: "#64748b", fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <TableRow key={u._id}>
                  <TableCell style={{ fontWeight: 500 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div style={{ 
                        width: "32px", height: "32px", 
                        borderRadius: "50%", 
                        backgroundColor: u.role === "admin" ? "#dbeafe" : "#f1f5f9",
                        color: u.role === "admin" ? "#2563eb" : "#64748b",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.875rem", fontWeight: 600
                      }}>
                        {u.name?.charAt(0).toUpperCase() || "U"}
                      </div>
                      {u.name || <span style={{ color: "#94a3b8", fontStyle: "italic" }}>Sin nombre</span>}
                    </div>
                  </TableCell>
                  <TableCell style={{ color: "#64748b" }}>{u.email}</TableCell>
                  <TableCell>
                    <Badge variant={u.role === "admin" ? "primary" : "neutral"}>
                      {u.role === "admin" ? "Administrador" : "Usuario"}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleChangeRole(u._id, u.role)}
                        title={u.role === "admin" ? "Quitar Admin" : "Hacer Admin"}
                        style={{ color: u.role === "admin" ? "#ef4444" : "#3b82f6" }}
                      >
                        {u.role === "admin" ? <UserX size={16} /> : <UserCheck size={16} />}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleResetPassword(u._id)}
                        title="Cambiar Contraseña"
                        style={{ color: "#f59e0b" }}
                      >
                        <Key size={16} />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleDelete(u._id)}
                        style={{ color: "#ef4444" }}
                        title="Eliminar Usuario"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>
                    No se encontraron usuarios
                  </TableCell>
                </TableRow>
              )}
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
            placeholder="Ej. Juan Pérez"
          />
          <Input 
            label="Email" 
            type="email" 
            required
            value={formData.email} 
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            placeholder="usuario@ejemplo.com"
          />
          <Input 
            label="Contraseña" 
            type="password" 
            required
            value={formData.password} 
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            placeholder="Mínimo 6 caracteres"
          />
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", marginBottom: "0.5rem", fontWeight: 500, color: "#334155" }}>Rol</label>
            <select 
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              style={{ 
                width: "100%", 
                padding: "0.75rem", 
                borderRadius: "0.5rem", 
                border: "1px solid #cbd5e1",
                backgroundColor: "white",
                fontSize: "0.875rem"
              }}
            >
              <option value="user">Usuario Estándar</option>
              <option value="admin">Administrador del Sistema</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} style={{ flex: 1 }}>Cancelar</Button>
            <Button type="submit" style={{ flex: 1 }}>Crear Usuario</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
