import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { clearToken, getToken } from "../lib/auth";

export default function Dashboard({ onLogout }) {
  const [me, setMe] = useState(null);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newRole, setNewRole] = useState("user");

  const token = getToken();

  async function load() {
    setError("");
    try {
      const rMe = await apiFetch("/auth/me", { token });
      setMe(rMe.data);

      const rUsers = await apiFetch("/users", { token });
      setUsers(rUsers.data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, []);

  async function logout() {
    clearToken();
    onLogout();
  }

  async function createUserAdmin(e) {
    e.preventDefault();
    setMsg("");
    setError("");
    try {
      const res = await apiFetch("/auth/register-admin", {
        token,
        method: "POST",
        body: { email: newEmail, password: newPass, name: newName, role: newRole }
      });
      setMsg(`Creado: ${res.data.email}`);
      setNewEmail(""); setNewName(""); setNewPass(""); setNewRole("user");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "30px auto", fontFamily: "system-ui" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Dashboard</h2>
        <button onClick={logout}>Salir</button>
      </div>

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {me && (
        <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
          <b>Yo:</b> {me.email} — <b>role:</b> {me.role}
        </div>
      )}

      <h3 style={{ marginTop: 20 }}>Usuarios</h3>
      <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
        {users.map((u) => (
          <div key={u._id} style={{ display: "flex", gap: 10, padding: "6px 0", borderBottom: "1px solid #eee" }}>
            <span style={{ width: 260 }}>{u.email}</span>
            <span style={{ width: 180 }}>{u.name}</span>
            <span style={{ width: 100 }}>{u.role}</span>
          </div>
        ))}
        {users.length === 0 && <p style={{ opacity: 0.7 }}>No hay usuarios</p>}
      </div>

      <h3 style={{ marginTop: 20 }}>Crear usuario (solo admin)</h3>
      <form onSubmit={createUserAdmin} style={{ display: "grid", gap: 10, border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nombre" />
        <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Email" />
        <input value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="Password" type="password" />
        <select value={newRole} onChange={(e) => setNewRole(e.target.value)}>
          <option value="user">user</option>
          <option value="admin">admin</option>
        </select>
        <button type="submit">Crear</button>
        {msg && <p style={{ color: "green" }}>{msg}</p>}
      </form>
    </div>
  );
}
