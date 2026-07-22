import { useEffect, useState } from "react";
import { Building2, CreditCard, RefreshCw, Trash2 } from "lucide-react";
import { apiFetch } from "../../lib/api";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";

export default function BankConnectionsPanel({ onImported }) {
  const [status, setStatus] = useState({ configured: false });
  const [connections, setConnections] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [selectedInstitution, setSelectedInstitution] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncingId, setSyncingId] = useState("");
  const [message, setMessage] = useState("");

  const loadConnections = async () => {
    const res = await apiFetch("/bank-connections/connections");
    setConnections(res.data || []);
  };

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const [statusRes, connectionsRes] = await Promise.all([
          apiFetch("/bank-connections/status"),
          apiFetch("/bank-connections/connections")
        ]);
        if (!alive) return;
        setStatus(statusRes.data || { configured: false });
        setConnections(connectionsRes.data || []);
      } catch (e) {
        if (alive) setMessage(e.message);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, []);

  const openConnectModal = async () => {
    setOpen(true);
    setMessage("");
    if (!status.configured || status.provider === "truelayer" || institutions.length > 0) return;

    setLoading(true);
    try {
      const res = await apiFetch("/bank-connections/institutions?country=ES");
      setInstitutions(res.data || []);
    } catch (e) {
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  };

  const createConnection = async () => {
    const isTrueLayer = status.provider === "truelayer";
    const institution = institutions.find((item) => item.id === selectedInstitution);
    if (!isTrueLayer && !institution) return;

    setLoading(true);
    setMessage("");
    try {
      const res = await apiFetch("/bank-connections/connections", {
        method: "POST",
        body: isTrueLayer ? { country: "ES" } : {
          country: "ES",
          institutionId: institution.id,
          institutionName: institution.name
        }
      });
      if (res.data?.link) {
        window.location.href = res.data.link;
      } else {
        setMessage("El banco no devolvio enlace de autorizacion.");
      }
    } catch (e) {
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshConnection = async (connectionId) => {
    setMessage("");
    try {
      await apiFetch(`/bank-connections/connections/${connectionId}/refresh`, { method: "POST" });
      await loadConnections();
    } catch (e) {
      setMessage(e.message);
    }
  };

  const syncConnection = async (connectionId) => {
    setSyncingId(connectionId);
    setMessage("");
    try {
      const res = await apiFetch(`/bank-connections/connections/${connectionId}/sync`, { method: "POST" });
      setMessage(`Sincronizacion completa. Gastos nuevos: ${res.data?.imported || 0}. Omitidos: ${res.data?.skipped || 0}.`);
      await loadConnections();
      onImported?.();
    } catch (e) {
      setMessage(e.message);
    } finally {
      setSyncingId("");
    }
  };

  const deleteConnection = async (connectionId) => {
    setMessage("");
    try {
      await apiFetch(`/bank-connections/connections/${connectionId}`, { method: "DELETE" });
      await loadConnections();
    } catch (e) {
      setMessage(e.message);
    }
  };

  return (
    <>
      <Card style={{ marginBottom: "1.5rem", padding: "1rem", display: "grid", gap: "0.875rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontWeight: 900 }}>
          <CreditCard size={20} color="var(--color-primary)" />
          Banco y tarjetas
        </div>
        <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: "0.875rem", lineHeight: 1.45 }}>
          Conecta una cuenta bancaria oficial para importar automaticamente los pagos con tarjeta como gastos.
        </p>

        {message && (
          <div style={{
            padding: "0.75rem",
            borderRadius: "var(--radius-md)",
            background: message.startsWith("Sincronizacion") ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)",
            color: message.startsWith("Sincronizacion") ? "var(--color-success)" : "var(--color-warning)",
            fontWeight: 800,
            fontSize: "0.85rem"
          }}>
            {message}
          </div>
        )}

        <div style={{ display: "grid", gap: "0.75rem" }}>
          {connections.map((connection) => (
            <div
              key={connection._id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: "0.75rem",
                alignItems: "center",
                padding: "0.85rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
                background: "var(--color-surface)"
              }}
            >
              <div>
                <div style={{ fontWeight: 900 }}>{connection.institutionName || connection.institutionId}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginTop: "0.25rem" }}>
                  {connection.status === "linked" ? "Autorizado" : "Pendiente"} · {connection.accounts?.length || 0} cuentas · {connection.cards?.length || 0} tarjetas
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
                <Button type="button" size="sm" variant="outline" onClick={() => refreshConnection(connection._id)}>
                  <RefreshCw size={14} />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="primary"
                  isLoading={syncingId === connection._id}
                  disabled={syncingId === connection._id}
                  onClick={() => syncConnection(connection._id)}
                >
                  Sincronizar
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => deleteConnection(connection._id)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Button type="button" variant="outline" onClick={openConnectModal} style={{ width: "100%" }}>
          <Building2 size={18} />
          Conectar banco
        </Button>
      </Card>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Conectar banco">
        <div style={{ display: "grid", gap: "1rem" }}>
          {!status.configured ? (
            <div style={{ color: "var(--color-warning)", fontWeight: 800 }}>
              Open Banking no esta configurado en Render.
            </div>
          ) : status.provider === "truelayer" ? (
            <>
              <div
                style={{
                  padding: "0.9rem",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border)",
                  background: "var(--color-surface)",
                  color: "var(--color-text-secondary)",
                  lineHeight: 1.45
                }}
              >
                Se abrira TrueLayer para que autorices tu banco o tarjeta. Al volver, podras sincronizar los movimientos y registrar gastos automaticamente.
              </div>

              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", flexWrap: "wrap" }}>
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  isLoading={loading}
                  disabled={loading}
                  onClick={createConnection}
                >
                  Autorizar banco
                </Button>
              </div>
            </>
          ) : (
            <>
              <label style={{ display: "grid", gap: "0.5rem", color: "var(--color-text)" }}>
                <span style={{ fontWeight: 800 }}>Banco</span>
                <select
                  value={selectedInstitution}
                  onChange={(e) => setSelectedInstitution(e.target.value)}
                  disabled={loading}
                  style={{
                    padding: "0.85rem",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface)",
                    color: "var(--color-text)"
                  }}
                >
                  <option value="">Selecciona tu banco</option>
                  {institutions.map((institution) => (
                    <option key={institution.id} value={institution.id}>
                      {institution.name}
                    </option>
                  ))}
                </select>
              </label>

              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", flexWrap: "wrap" }}>
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  isLoading={loading}
                  disabled={!selectedInstitution || loading}
                  onClick={createConnection}
                >
                  Autorizar banco
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}
