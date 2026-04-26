import { createContext, useContext, useState, useEffect } from "react";
import { getToken, clearToken } from "../lib/auth";
import { apiFetch } from "../lib/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [loading, setLoading] = useState(true);
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem("biometricUnlocked") === "true");
  const userLoggedIn = localStorage.getItem("userLoggedIn") === "true" || Boolean(getToken());
  const biometricEnabled = localStorage.getItem("biometricEnabled") === "true" || Boolean(getToken()) || userLoggedIn;
  const biometricCapable =
    typeof window !== "undefined" &&
    "PublicKeyCredential" in window &&
    typeof navigator !== "undefined" &&
    typeof navigator.credentials?.get === "function" &&
    typeof navigator.credentials?.create === "function";
  const biometricRequired = biometricEnabled && biometricCapable;

  const fetchUser = async () => {
    const token = getToken();
    
    if (!token) {
      setUser(null);
      setLoading(false);
      localStorage.removeItem("user");
      sessionStorage.removeItem("user");
      return;
    }

    localStorage.setItem("userLoggedIn", "true");
    localStorage.setItem("biometricEnabled", "true");

    try {
      const res = await apiFetch("/auth/me");
      setUser(res.data);
      localStorage.setItem("user", JSON.stringify(res.data));
    } catch (error) {
      console.error("Error fetching user", error);
      const msg = String(error?.message || "");
      const m = msg.match(/Error API:\s*(\d{3})\s*-/);
      const status = m ? Number(m[1]) : null;
      if (status === 401 || status === 403) {
        clearToken();
        setUser(null);
        localStorage.removeItem("user");
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("biometricUnlocked");
        setUnlocked(false);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const unlock = () => {
    setUnlocked(true);
    sessionStorage.setItem("biometricUnlocked", "true");
  };

  const logout = () => {
    clearToken();
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("userLoggedIn");
    localStorage.removeItem("biometricEnabled");
    localStorage.removeItem("biometricRegistered");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("biometricUnlocked");
    setUnlocked(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, fetchUser, biometricRequired, unlocked, unlock, userLoggedIn }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
