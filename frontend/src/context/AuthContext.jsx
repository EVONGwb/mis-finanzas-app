import { createContext, useContext, useState, useEffect } from "react";
import { getToken, clearToken } from "../lib/auth";
import { apiFetch } from "../lib/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // Intentar recuperar del localStorage al inicio para evitar parpadeo "Usuario"
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    const token = getToken();
    // No ponemos loading true aquí para evitar parpadeo si ya tenemos usuario en caché
    // setLoading(true); 
    
    if (!token) {
      setUser(null);
      setLoading(false);
      localStorage.removeItem("user");
      return;
    }

    try {
      const res = await apiFetch("/auth/me");
      setUser(res.data);
      localStorage.setItem("user", JSON.stringify(res.data));
    } catch (error) {
      console.error("Error fetching user", error);
      // Si falla la API pero tenemos token, podría ser error temporal.
      // Solo borramos si es 401
      if (error.message.includes("401") || error.message.includes("auth")) {
        clearToken();
        setUser(null);
        localStorage.removeItem("user");
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
    localStorage.removeItem("user");
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
