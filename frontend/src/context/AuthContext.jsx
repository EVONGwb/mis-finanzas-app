import { createContext, useContext, useState, useEffect } from "react";
import { getToken, clearToken } from "../lib/auth";
import { apiFetch } from "../lib/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // Intentar recuperar de sessionStorage (sesión actual)
    const storedUser = sessionStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    const token = getToken(); // Lee de sessionStorage ahora
    
    if (!token) {
      setUser(null);
      setLoading(false);
      sessionStorage.removeItem("user");
      return;
    }

    try {
      const res = await apiFetch("/auth/me");
      setUser(res.data);
      sessionStorage.setItem("user", JSON.stringify(res.data));
    } catch (error) {
      console.error("Error fetching user", error);
      // Solo borramos si es 401
      if (error.message.includes("401") || error.message.includes("auth")) {
        clearToken();
        setUser(null);
        sessionStorage.removeItem("user");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const logout = () => {
    clearToken();
    setUser(null);
    sessionStorage.removeItem("user");
    // Mark as intentionally logged out so biometric doesn't auto-trigger immediately
    sessionStorage.setItem("just_logged_out", "true");
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
