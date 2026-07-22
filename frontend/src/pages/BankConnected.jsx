import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, AlertCircle } from "lucide-react";
import { apiFetch } from "../lib/api";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";

export default function BankConnected() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Comprobando autorizacion bancaria...");

  useEffect(() => {
    const connectionId = params.get("connection");
    const code = params.get("code");
    const state = params.get("state");
    const error = params.get("error");
    const errorDescription = params.get("error_description");

    if (error) {
      setStatus("error");
      setMessage(errorDescription || "El banco no completo la autorizacion.");
      return;
    }

    let alive = true;
    async function refresh() {
      try {
        let res;
        if (code && state) {
          res = await apiFetch("/bank-connections/truelayer/callback", {
            method: "POST",
            body: {
              code,
              state,
              redirectUri: `${window.location.origin}/bank-connected`
            }
          });
        } else if (connectionId) {
          res = await apiFetch(`/bank-connections/connections/${connectionId}/refresh`, { method: "POST" });
        } else {
          throw new Error("No se encontro la conexion bancaria.");
        }

        if (!alive) return;
        const accounts = res.data?.accounts?.length || 0;
        const cards = res.data?.cards?.length || 0;
        const linked = accounts > 0 || cards > 0 || res.data?.status === "linked";
        setStatus(linked ? "success" : "error");
        setMessage(linked
          ? "Banco autorizado correctamente."
          : "El banco todavia no devolvio cuentas o tarjetas autorizadas.");
      } catch (e) {
        if (!alive) return;
        setStatus("error");
        setMessage(e.message || "No se pudo confirmar la autorizacion.");
      }
    }

    refresh();
    return () => {
      alive = false;
    };
  }, [params]);

  return (
    <div className="animate-fade-in" style={{ paddingBottom: "5rem" }}>
      <Card style={{ display: "grid", gap: "1rem", textAlign: "center", padding: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          {status === "success" ? (
            <CheckCircle size={48} color="var(--color-success)" />
          ) : (
            <AlertCircle size={48} color={status === "loading" ? "var(--color-warning)" : "var(--color-danger)"} />
          )}
        </div>
        <h1 style={{ fontSize: "1.5rem" }}>Conexion bancaria</h1>
        <p style={{ margin: 0, color: "var(--color-text-secondary)" }}>{message}</p>
        <Button type="button" onClick={() => navigate("/expenses")} style={{ width: "100%" }}>
          Volver a Gastos
        </Button>
      </Card>
    </div>
  );
}
