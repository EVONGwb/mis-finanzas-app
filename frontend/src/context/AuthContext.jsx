import { createContext, useContext, useState, useEffect } from "react";
import { apiFetch } from "../lib/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/auth/session");
      const authenticated = Boolean(res?.data?.authenticated);
      const sessionUser = res?.data?.user || null;

      if (!authenticated || !sessionUser) {
        setUser(null);
        localStorage.removeItem("user");
        sessionStorage.removeItem("user");
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        localStorage.removeItem("userLoggedIn");
        localStorage.removeItem("biometricEnabled");
        localStorage.removeItem("biometricRegistered");
        sessionStorage.removeItem("biometricUnlocked");
        localStorage.removeItem("lastLoginEmail");
        localStorage.removeItem("bio_v3_registered");
        localStorage.removeItem("bio_credential_id");
        return;
      }

      setUser(sessionUser);
    } catch (error) {
      console.error("Error fetching user", error);
      const msg = String(error?.message || "");
      const m = msg.match(/Error API:\s*(\d{3})\s*-/);
      const status = m ? Number(m[1]) : null;
      if (status === 401 || status === 403) {
        setUser(null);
        localStorage.removeItem("user");
        sessionStorage.removeItem("user");
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        localStorage.removeItem("userLoggedIn");
        localStorage.removeItem("biometricEnabled");
        localStorage.removeItem("biometricRegistered");
        sessionStorage.removeItem("biometricUnlocked");
        localStorage.removeItem("lastLoginEmail");
        localStorage.removeItem("bio_v3_registered");
        localStorage.removeItem("bio_credential_id");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const logout = async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {
    }
    setUser(null);
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    localStorage.removeItem("userLoggedIn");
    localStorage.removeItem("biometricEnabled");
    localStorage.removeItem("biometricRegistered");
    sessionStorage.removeItem("biometricUnlocked");
    localStorage.removeItem("lastLoginEmail");
    localStorage.removeItem("bio_v3_registered");
    localStorage.removeItem("bio_credential_id");
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
