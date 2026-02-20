import { useState } from "react";
import { apiFetch } from "../lib/api";
import { setToken } from "../lib/auth";

export default function Register({ onAuthed }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      const res = await apiFetch("/auth/register", {
        method: "POST",
        body: { email, password, name }
      });
      setToken(res.data.token);
      onAuthed();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={{ maxWidth: 380, margin: "40px auto", fontFamily: "system-ui" }}>
      <h2>Register</h2>
      <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (mín 6)" type="password" />
        <button type="submit">Crear cuenta</button>
      </form>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
    </div>
  );
}
