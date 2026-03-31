import { useState } from "react";
import { api, setToken, setUser } from "../lib/api";

export default function Login({ onDone }) {
  const [email, setEmail] = useState("admin@misfinanzas.com");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api("/auth/login", { method: "POST", body: { email, password } });
      setToken(res.data.token);
      setUser(res.data.user);
      onDone?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "60px auto", fontFamily: "system-ui" }}>
      <h2>Mis Finanzas — Login</h2>
      <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" />
        <button disabled={loading}>{loading ? "Entrando..." : "Entrar"}</button>
        {error && <div style={{ color: "crimson" }}>{error}</div>}
      </form>
    </div>
  );
}