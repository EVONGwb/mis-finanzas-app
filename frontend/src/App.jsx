import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Incomes from "./pages/Incomes";
import Expenses from "./pages/Expenses";
import Closing from "./pages/Closing";
import { Layout } from "./components/layout/Layout";
import { getToken, clearToken } from "./lib/auth";
import { apiFetch } from "./lib/api";

function ProtectedRoute({ children, onLogout }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch user info or just validate token presence
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    
    // We can try to fetch user details here if there is an endpoint
    // For now we assume token is enough or we decode it.
    // Let's assume valid for UI speed, or fetch /users/me if it exists.
    // Based on routes, /users is admin only?
    // Let's just use a placeholder user or decode token if needed.
    // I'll just set a dummy user state for the layout avatar.
    setUser({ name: "Usuario", email: "user@evongo.com" });
    setLoading(false);
  }, []);

  const token = getToken();
  if (!token) return <Navigate to="/login" replace />;

  return (
    <Layout onLogout={onLogout} user={user}>
      {children}
    </Layout>
  );
}

export default function App() {
  const [authed, setAuthed] = useState(Boolean(getToken()));

  const handleLogin = () => {
    setAuthed(true);
  };

  const handleLogout = () => {
    clearToken();
    setAuthed(false);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/login" 
          element={!authed ? <Login onAuthed={handleLogin} /> : <Navigate to="/" replace />} 
        />
        
        <Route 
          path="/" 
          element={
            <ProtectedRoute onLogout={handleLogout}>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/incomes" 
          element={
            <ProtectedRoute onLogout={handleLogout}>
              <Incomes />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/expenses" 
          element={
            <ProtectedRoute onLogout={handleLogout}>
              <Expenses />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/closing" 
          element={
            <ProtectedRoute onLogout={handleLogout}>
              <Closing />
            </ProtectedRoute>
          } 
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
