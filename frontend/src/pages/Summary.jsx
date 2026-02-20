import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { getToken } from "../lib/auth";

export default function Summary() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const token = getToken();
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;

        const res = await apiFetch(`/summary?year=${year}&month=${month}`, { token });
        setData(res.data);
      } catch (e) {
        setError(e.message);
      }
    })();
  }, []);

  return (
    <div style={{ maxWidth: 520, margin: "40px auto", fontFamily: "system-ui" }}>
      <h2>Resumen del mes</h2>

      {error && <p style={{ color: "crimson" }}>{error}</p>}
      {!data && !error && <p>Cargando...</p>}

      {data && (
        <div style={{ display: "grid", gap: 10 }}>
          <div><b>Año:</b> {data.period.year} <b>Mes:</b> {data.period.month}</div>
          <div><b>Ingresos:</b> {data.totals.incomes}</div>
          <div><b>Gastos:</b> {data.totals.expenses}</div>
          <div><b>Balance:</b> {data.totals.balance}</div>
          <div style={{ opacity: 0.7 }}>
            Incomes: {data.counts.incomes} · Expenses: {data.counts.expenses}
          </div>
        </div>
      )}
    </div>
  );
}
