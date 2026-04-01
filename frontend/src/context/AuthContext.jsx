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
  const biometricEnabled = localStorage.getItem("biometricEnabled") === "true" || Boolean(getToken());
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
      // Don't clear biometrics when logging out or no token, just user data
      setUser(null);
      setLoading(false);
      localStorage.removeItem("user");
      sessionStorage.removeItem("user");
      return;
    }

    if (localStorage.getItem("biometricEnabled") !== "true") {
      localStorage.setItem("biometricEnabled", "true");
    }

    try {
      const res = await apiFetch("/auth/me");
      setUser(res.data);
      localStorage.setItem("user", JSON.stringify(res.data));
    } catch (error) {
      console.error("Error fetching user", error);
      clearToken();
      setUser(null);
      localStorage.removeItem("user");
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("biometricUnlocked");
      setUnlocked(false);
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
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("biometricUnlocked");
    setUnlocked(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, fetchUser, biometricRequired, unlocked, unlock }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
