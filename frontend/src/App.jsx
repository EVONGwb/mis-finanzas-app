import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Layout } from "./components/layout/Layout";
import { getToken, clearToken } from "./lib/auth";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CurrencyProvider } from "./context/CurrencyContext";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";

// Lazy loading components
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Incomes = lazy(() => import("./pages/Incomes"));
const Expenses = lazy(() => import("./pages/Expenses"));
const Debts = lazy(() => import("./pages/Debts"));
const Credits = lazy(() => import("./pages/Credits"));
const Home = lazy(() => import("./pages/Home"));
const Closing = lazy(() => import("./pages/Closing"));
const DeliveriesDashboard = lazy(() => import("./pages/deliveries/DeliveriesDashboard"));
const Goals = lazy(() => import("./pages/Goals"));
const Reports = lazy(() => import("./pages/Reports"));
const Bank = lazy(() => import("./pages/Bank"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const Profile = lazy(() => import("./pages/Profile"));

// Loading Component
const LoadingFallback = () => (
  <div style={{ 
    display: "flex", 
    justifyContent: "center", 
    alignItems: "center", 
    height: "100vh", 
    width: "100%",
    backgroundColor: "var(--color-background)"
  }}>
    <div className="animate-spin" style={{ 
      width: "40px", 
      height: "40px", 
      border: "3px solid var(--color-border)", 
      borderTopColor: "var(--color-primary)", 
      borderRadius: "50%" 
    }} />
  </div>
);

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
  if (loading) return <LoadingFallback />;
  
  return <AppLayout>{children}</AppLayout>;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingFallback />;
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
      <CurrencyProvider>
        <PWAInstallPrompt />
        <Suspense fallback={<LoadingFallback />}>
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
            path="/debts"
            element={
              <Protected>
                <Debts />
              </Protected>
            }
          />
          <Route
            path="/credits"
            element={
              <Protected>
                <Credits />
              </Protected>
            }
          />
          <Route
            path="/home"
            element={
              <Protected>
                <Home />
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
            path="/goals"
            element={
              <Protected>
                <Goals />
              </Protected>
            }
          />
          <Route
            path="/reports"
            element={
              <Protected>
                <Reports />
              </Protected>
            }
          />
          <Route
            path="/bank"
            element={
              <Protected>
                <Bank />
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
      </Suspense>
      </CurrencyProvider>
    </AuthProvider>
  );
}
