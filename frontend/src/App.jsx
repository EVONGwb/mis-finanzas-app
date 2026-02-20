import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Incomes from "./pages/Incomes";
import Expenses from "./pages/Expenses";
import Closing from "./pages/Closing";
import { Layout } from "./components/layout/Layout";
import { getToken, clearToken } from "./lib/auth";

function AppLayout({ children }) {
  const navigate = useNavigate();

  const onLogout = () => {
    clearToken();
    navigate("/login", { replace: true });
  };

  const user = { name: "Usuario", email: "user@evongo.com" };

  return <Layout onLogout={onLogout} user={user}>{children}</Layout>;
}

function Protected({ children }) {
  const token = getToken();
  if (!token) return <Navigate to="/login" replace />;
  return <AppLayout>{children}</AppLayout>;
}

function LoginRoute() {
  const navigate = useNavigate();
  const token = getToken();
  if (token) return <Navigate to="/dashboard" replace />;

  return <Login onAuthed={() => navigate("/dashboard", { replace: true })} />;
}

function RegisterRoute() {
  const navigate = useNavigate();
  const token = getToken();
  if (token) return <Navigate to="/dashboard" replace />;

  return <Register onAuthed={() => navigate("/dashboard", { replace: true })} />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/register" element={<RegisterRoute />} />

      <Route
        path="/dashboard"
        element={
          <Protected>
            <Dashboard />
          </Protected>
        }
      />
      <Route
        path="/incomes"
        element={
          <Protected>
            <Incomes />
          </Protected>
        }
      />
      <Route
        path="/expenses"
        element={
          <Protected>
            <Expenses />
          </Protected>
        }
      />
      <Route
        path="/closing"
        element={
          <Protected>
            <Closing />
          </Protected>
        }
      />

      <Route path="*" element={<div style={{ padding: 20 }}>Ruta no encontrada</div>} />
    </Routes>
  );
}
