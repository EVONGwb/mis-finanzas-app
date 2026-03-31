import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Layout } from "./components/layout/Layout";
import { AdminLayout } from "./components/layout/AdminLayout";
import { getToken, clearToken } from "./lib/auth";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CurrencyProvider } from "./context/CurrencyContext";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";

import { SubscriptionGuard } from "./components/auth/SubscriptionGuard";

// Lazy loading components
const Login = lazy(() => import("./pages/Login"));
const Subscribe = lazy(() => import("./pages/Subscribe"));
const SubscribeSuccess = lazy(() => import("./pages/SubscribeSuccess"));
const SubscribeCancel = lazy(() => import("./pages/SubscribeCancel"));
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
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminAudit = lazy(() => import("./pages/admin/AdminAudit"));
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

function AdminAppLayout({ children }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const onLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return <AdminLayout onLogout={onLogout} user={user}>{children}</AdminLayout>;
}

function Protected({ children }) {
  const { user, loading, biometricRequired, unlocked } = useAuth();
  const token = getToken();
  
  if (!token) return <Navigate to="/login" replace />;
  if (biometricRequired && !unlocked) return <Navigate to="/login" replace />;
  if (loading) return <LoadingFallback />;
  
  return <AppLayout>{children}</AppLayout>;
}

function ProtectedWithSubscription({ children }) {
  // Desactivado temporalmente según petición
  // return (
  //   <Protected>
  //     <SubscriptionGuard>
  //       {children}
  //     </SubscriptionGuard>
  //   </Protected>
  // );
  return <Protected>{children}</Protected>;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingFallback />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/dashboard" replace />;

  return <AdminAppLayout>{children}</AdminAppLayout>;
}

function LoginRoute() {
  const navigate = useNavigate();
  const { fetchUser, biometricRequired, unlocked, unlock } = useAuth();
  const token = getToken();
  
  if (token && (!biometricRequired || unlocked)) return <Navigate to="/dashboard" replace />;

  const handleAuthed = async () => {
    await fetchUser();
    if (localStorage.getItem("biometricEnabled") === "true") unlock();
    navigate("/dashboard", { replace: true });
  };

  return <Login onAuthed={handleAuthed} />;
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
          <Route path="/register" element={<Navigate to="/login" replace />} />

          {/* Subscription Routes (Protected by Auth only) */}
          <Route 
            path="/subscribe" 
            element={
              <Protected>
                <Subscribe />
              </Protected>
            } 
          />
          <Route 
            path="/subscribe/success" 
            element={
              <Protected>
                <SubscribeSuccess />
              </Protected>
            } 
          />
          <Route 
            path="/subscribe/cancel" 
            element={
              <Protected>
                <SubscribeCancel />
              </Protected>
            } 
          />

          {/* Main App Routes (Protected by Auth + Subscription) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedWithSubscription>
                <Dashboard />
              </ProtectedWithSubscription>
            }
          />
          <Route
            path="/incomes"
            element={
              <ProtectedWithSubscription>
                <Incomes />
              </ProtectedWithSubscription>
            }
          />
          <Route
            path="/expenses"
            element={
              <ProtectedWithSubscription>
                <Expenses />
              </ProtectedWithSubscription>
            }
          />
          <Route
            path="/debts"
            element={
              <ProtectedWithSubscription>
                <Debts />
              </ProtectedWithSubscription>
            }
          />
          <Route
            path="/credits"
            element={
              <ProtectedWithSubscription>
                <Credits />
              </ProtectedWithSubscription>
            }
          />
          <Route
            path="/home"
            element={
              <ProtectedWithSubscription>
                <Home />
              </ProtectedWithSubscription>
            }
          />
          <Route
            path="/closing"
            element={
              <ProtectedWithSubscription>
                <Closing />
              </ProtectedWithSubscription>
            }
          />
          <Route
            path="/deliveries"
            element={
              <ProtectedWithSubscription>
                <DeliveriesDashboard />
              </ProtectedWithSubscription>
            }
          />
          <Route
            path="/goals"
            element={
              <ProtectedWithSubscription>
                <Goals />
              </ProtectedWithSubscription>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedWithSubscription>
                <Reports />
              </ProtectedWithSubscription>
            }
          />
          <Route
            path="/bank"
            element={
              <ProtectedWithSubscription>
                <Bank />
              </ProtectedWithSubscription>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedWithSubscription>
                <Profile />
              </ProtectedWithSubscription>
            }
          />

          {/* Admin Routes */}
          <Route 
            path="/admin" 
            element={<Navigate to="/admin/dashboard" replace />} 
          />
          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <AdminUsers />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/audit"
            element={
              <AdminRoute>
                <AdminAudit />
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
