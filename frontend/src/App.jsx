import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Incomes from "./pages/Incomes";
import Expenses from "./pages/Expenses";
import Closing from "./pages/Closing";
import DeliveriesDashboard from "./pages/deliveries/DeliveriesDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import Profile from "./pages/Profile";
import { Layout } from "./components/layout/Layout";
import { getToken, clearToken } from "./lib/auth";
import { AuthProvider, useAuth } from "./context/AuthContext";

function AppLayout({ children }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const onLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return <Layout onLogout={onLogout} user={user}>{children}</Layout>;
}

function Protected({ children }) {
  const { user, loading } = useAuth();
  const token = getToken();
  
  if (!token) return <Navigate to="/login" replace />;
  if (loading) return <div>Cargando...</div>;
  
  return <AppLayout>{children}</AppLayout>;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <div>Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/dashboard" replace />;

  return <AppLayout>{children}</AppLayout>;
}

function LoginRoute() {
  const navigate = useNavigate();
  const { fetchUser } = useAuth();
  const token = getToken();
  
  if (token) return <Navigate to="/dashboard" replace />;

  const handleAuthed = async () => {
    await fetchUser();
    navigate("/dashboard", { replace: true });
  };

  return <Login onAuthed={handleAuthed} />;
}

function RegisterRoute() {
  const navigate = useNavigate();
  const { fetchUser } = useAuth();
  const token = getToken();
  
  if (token) return <Navigate to="/dashboard" replace />;

  const handleAuthed = async () => {
    await fetchUser();
    navigate("/dashboard", { replace: true });
  };

  return <Register onAuthed={handleAuthed} />;
}

export default function App() {
  return (
    <AuthProvider>
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
        <Route
          path="/deliveries"
          element={
            <Protected>
              <DeliveriesDashboard />
            </Protected>
          }
        />
        <Route
          path="/profile"
          element={
            <Protected>
              <Profile />
            </Protected>
          }
        />

        {/* Admin Routes */}
        <Route 
          path="/admin" 
          element={<Navigate to="/admin/users" replace />} 
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <AdminUsers />
            </AdminRoute>
          }
        />

        <Route path="*" element={<div style={{ padding: 20 }}>Página no encontrada</div>} />
      </Routes>
    </AuthProvider>
  );
}
