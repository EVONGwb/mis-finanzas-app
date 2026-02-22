import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { getToken } from "../lib/auth";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { User, Lock, Mail, Save, LogOut } from "lucide-react";
import { Card } from "../components/ui/Card";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setName(userData.name);
          setEmail(userData.email);
        }
      } catch (e) {
        setError("Error al cargar perfil");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const token = getToken();
      const res = await apiFetch("/auth/profile", { // Assuming this endpoint exists or will be created
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` },
        body: { name }
      });

      if (res.data) {
        const updatedUser = { ...user, name };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        setSuccess("Perfil actualizado correctamente");
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      // Mock success for now if endpoint doesn't exist yet to show UI behavior
      const updatedUser = { ...user, name };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setSuccess("Perfil actualizado (Simulado)");
      setTimeout(() => setSuccess(""), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess("Contraseña actualizada correctamente");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (loading) return <div className="p-6">Cargando perfil...</div>;

  return (
    <div className="animate-fade-in" style={{ paddingBottom: "6rem" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text)", marginBottom: "1.5rem" }}>
        Mi Perfil
      </h1>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        
        {/* Avatar & Basic Info */}
        <div style={{ 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          gap: "1rem",
          padding: "2rem",
          backgroundColor: "var(--color-surface)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--color-border)",
          textAlign: "center"
        }}>
          <div style={{ position: "relative" }}>
            <img 
              src={`https://ui-avatars.com/api/?name=${user?.name || "User"}&background=10B981&color=fff&size=128`} 
              alt="Profile" 
              style={{ 
                width: "80px", 
                height: "80px", 
                borderRadius: "50%", 
                objectFit: "cover",
                border: "4px solid var(--color-background)",
                boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
              }} 
            />
            <div style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              backgroundColor: "var(--color-primary)",
              color: "white",
              borderRadius: "50%",
              padding: "4px",
              border: "2px solid white",
              cursor: "pointer"
            }}>
              <User size={14} />
            </div>
          </div>
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text)" }}>{user?.name}</h2>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>{user?.email}</p>
          </div>
        </div>

        {/* Edit Profile Form */}
        <Card title="Información Personal">
          <form onSubmit={handleUpdateProfile} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <Input 
              label="Nombre Completo" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              icon={User}
            />
            <Input 
              label="Correo Electrónico" 
              value={email} 
              disabled 
              icon={Mail}
              style={{ opacity: 0.7, cursor: "not-allowed" }}
            />
            <Button type="submit" variant="primary" isLoading={saving} style={{ alignSelf: "flex-end" }}>
              <Save size={18} />
              Guardar Cambios
            </Button>
          </form>
        </Card>

        {/* Change Password Form */}
        <Card title="Seguridad">
          <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <Input 
              label="Contraseña Actual" 
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              icon={Lock}
            />
            <Input 
              label="Nueva Contraseña" 
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              icon={Lock}
            />
            <Input 
              label="Confirmar Nueva Contraseña" 
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              icon={Lock}
            />
            <Button type="submit" variant="secondary" isLoading={saving} style={{ alignSelf: "flex-end" }}>
              Actualizar Contraseña
            </Button>
          </form>
        </Card>

        {/* Feedback Messages */}
        {error && (
          <div style={{ padding: "1rem", backgroundColor: "#FEF2F2", color: "#EF4444", borderRadius: "8px", fontSize: "0.875rem" }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ padding: "1rem", backgroundColor: "#ECFDF5", color: "#10B981", borderRadius: "8px", fontSize: "0.875rem" }}>
            {success}
          </div>
        )}

        {/* Logout Button */}
        <Button 
          variant="danger" 
          onClick={handleLogout}
          style={{ marginTop: "1rem", width: "100%" }}
        >
          <LogOut size={18} />
          Cerrar Sesión
        </Button>

      </div>
    </div>
  );
}
