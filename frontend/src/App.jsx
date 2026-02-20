import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Link, useNavigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import { getToken } from "./lib/auth";

function Home() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(!!getToken());

  useEffect(() => {
    setAuthed(!!getToken());
  }, []);

  function onAuthed() {
    setAuthed(true);
    navigate("/dashboard");
  }

  function onLogout() {
    setAuthed(false);
    navigate("/login");
  }

  return (
    <div>
      <nav style={{ display: "flex", gap: 12, padding: 12, borderBottom: "1px solid #eee", fontFamily: "system-ui" }}>
        <Link to="/login">Login</Link>
        <Link to="/register">Register</Link>
        <Link to="/dashboard">Dashboard</Link>
      </nav>

      <Routes>
        <Route path="/" element={<div style={{ padding: 20, fontFamily: "system-ui" }}>
          <h2>Frontend conectado</h2>
          <p>Authed: <b>{authed ? "sí" : "no"}</b></p>
        </div>} />
        <Route path="/login" element={<Login onAuthed={onAuthed} />} />
        <Route path="/register" element={<Register onAuthed={onAuthed} />} />
        <Route path="/dashboard" element={<Dashboard onLogout={onLogout} />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Home />
    </BrowserRouter>
  );
}
