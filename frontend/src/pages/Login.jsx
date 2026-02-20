import { useState } from "react";
import { apiFetch } from "../lib/api";
import { setToken } from "../lib/auth";

export default function Login({ onAuthed }) {
  const [email, setEmail] = useState("user1@evongo.com");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      const res = await apiFetch("/auth/login", {
        method: "POST",
        body: { email, password }
      });
      setToken(res.data.token);
      onAuthed();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={{ maxWidth: 380, margin: "40px auto", fontFamily: "system-ui" }}>
      <h2>Login</h2>
      <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" />
        <button type="submit">Entrar</button>
      </form>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
    </div>
  );
}
