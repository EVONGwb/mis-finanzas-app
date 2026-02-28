import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";
import { getToken } from "../../lib/auth";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Table, TableRow, TableCell } from "../../components/ui/Table";
import { Search, Filter } from "lucide-react";
import { Input } from "../../components/ui/Input";

export default function AdminAudit() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const res = await apiFetch("/admin/audit", { token: getToken() });
        setLogs(res.data.items || []);
      } catch (e) {
        setError(e.message || "Error cargando logs");
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.actor?.userId?.email || log.actor?.email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.875rem", fontWeight: 700, color: "#1e293b", margin: 0 }}>Registro de Auditoría</h1>
          <p style={{ color: "#64748b", marginTop: "0.25rem" }}>Monitorización de actividades del sistema</p>
        </div>
      </div>

      <Card style={{ marginBottom: "1.5rem", padding: "1rem" }}>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1, maxWidth: "400px" }}>
            <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
            <input 
              type="text" 
              placeholder="Buscar por acción, usuario o mensaje..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "0.625rem 1rem 0.625rem 2.5rem",
                borderRadius: "0.5rem",
                border: "1px solid #cbd5e1",
                outline: "none",
                fontSize: "0.875rem"
              }}
            />
          </div>
          {/* Add more filters if needed */}
        </div>
      </Card>

      {error && <div style={{ color: "#ef4444", marginBottom: "1rem", padding: "1rem", backgroundColor: "#fef2f2", borderRadius: "0.5rem" }}>{error}</div>}

      <Card style={{ overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>Cargando registros...</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
              <thead style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <tr>
                  <th style={{ padding: "1rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Fecha</th>
                  <th style={{ padding: "1rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Acción</th>
                  <th style={{ padding: "1rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Usuario</th>
                  <th style={{ padding: "1rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Detalles</th>
                  <th style={{ padding: "1rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>IP</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "1rem", fontSize: "0.875rem", color: "#1e293b", whiteSpace: "nowrap" }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: "1rem", fontSize: "0.875rem" }}>
                      <Badge variant="neutral">{log.action}</Badge>
                    </td>
                    <td style={{ padding: "1rem", fontSize: "0.875rem", color: "#334155" }}>
                      {log.actor?.userId ? (
                        <div>
                          <div style={{ fontWeight: 500 }}>{log.actor.userId.name}</div>
                          <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{log.actor.userId.email}</div>
                        </div>
                      ) : log.actor?.email ? (
                        <div>
                          <div style={{ fontWeight: 500 }}>Usuario Eliminado/Sistema</div>
                          <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{log.actor.email}</div>
                        </div>
                      ) : (
                        <span style={{ color: "#94a3b8" }}>Sistema / Desconocido</span>
                      )}
                    </td>
                    <td style={{ padding: "1rem", fontSize: "0.875rem", color: "#475569", maxWidth: "300px" }}>
                      {log.message}
                    </td>
                    <td style={{ padding: "1rem", fontSize: "0.875rem", color: "#64748b", fontFamily: "monospace" }}>
                      {log.ip || "-"}
                    </td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}>
                      No se encontraron registros que coincidan con "{searchTerm}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
