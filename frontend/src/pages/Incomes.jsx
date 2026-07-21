import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Table, TableRow, TableCell } from "../components/ui/Table";
import { Modal } from "../components/ui/Modal";
import { useCurrency } from "../context/CurrencyContext";
import { Plus, Filter, Trash2, Building2, Save } from "lucide-react";

export default function Incomes() {
  const { formatCurrency, currency } = useCurrency();
  const [companies, setCompanies] = useState([]);
  const [entries, setEntries] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [savingCompanyId, setSavingCompanyId] = useState(null);
  const [receiptDrafts, setReceiptDrafts] = useState({});

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    companyId: "",
    hours: ""
  });

  // Filter state
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const monthRange = useMemo(() => {
    const m = Number(month);
    const y = Number(year);
    const from = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0)).toISOString();
    const to = new Date(Date.UTC(y, m, 0, 23, 59, 59)).toISOString();
    return { from, to };
  }, [month, year]);

  const formatReceiptDraft = (value) => {
    if (value === undefined || value === null || value === "") return "";
    const parsed = Number(String(value).trim().replace(/\./g, "").replace(",", "."));
    if (Number.isFinite(parsed) && parsed === 0) return "";
    if (!Number.isFinite(parsed)) return "";
    return new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 }).format(parsed);
  };

  const formatMoneyInput = (value) => {
    const raw = String(value ?? "").replace(/[^\d.,]/g, "");
    if (!raw) return "";

    const lastComma = raw.lastIndexOf(",");
    const lastDot = raw.lastIndexOf(".");
    const sepIndex = Math.max(lastComma, lastDot);
    const hasDecimal = sepIndex >= 0 && raw.slice(sepIndex + 1).replace(/\D/g, "").length <= 2;

    const integerDigits = (hasDecimal ? raw.slice(0, sepIndex) : raw)
      .replace(/\D/g, "")
      .replace(/^0+(?=\d)/, "");
    const decimalDigits = hasDecimal ? raw.slice(sepIndex + 1).replace(/\D/g, "").slice(0, 2) : "";
    const groupedInteger = integerDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

    return hasDecimal ? `${groupedInteger || "0"},${decimalDigits}` : groupedInteger;
  };

  const parseMoneyDraft = (value) => {
    const raw = String(value ?? "").trim().replace(/[^\d.,]/g, "");
    if (!raw) return 0;
    const parsed = raw.includes(",")
      ? Number(raw.replace(/\./g, "").replace(",", "."))
      : Number(raw.replace(/\.(?=\d{3}(?:\.|$))/g, ""));
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      setError("");
      const [companiesRes, entriesRes, receiptsRes] = await Promise.all([
        apiFetch("/companies"),
        apiFetch(`/work-entries?from=${encodeURIComponent(monthRange.from)}&to=${encodeURIComponent(monthRange.to)}`),
        apiFetch(`/income-receipts?month=${encodeURIComponent(month)}&year=${encodeURIComponent(year)}`)
      ]);
      const comps = companiesRes.data || [];
      setCompanies(comps);
      setEntries(entriesRes.data || []);
      setReceipts(receiptsRes.data || []);

      // Prime drafts (do not overwrite user typing)
      setReceiptDrafts((prev) => {
        const next = { ...prev };
        (receiptsRes.data || []).forEach((r) => {
          const id = r.company?._id || r.company;
          if (!id) return;
          const key = String(id);
          if (next[key] === undefined) next[key] = formatReceiptDraft(r.amountReceived);
        });
        return next;
      });

      // Default company selection for modal
      if (!formData.companyId && comps.length > 0) {
        setFormData((prev) => ({ ...prev, companyId: String(comps[0]._id) }));
      }
    } catch (e) {
      setError(e.message || "Error API");
    } finally {
      setLoading(false);
    }
  };

  // Force re-render on currency change without re-fetching
  useEffect(() => {
    // Just trigger a re-render if needed, but since we use formatCurrency in render, 
    // it should update automatically if context updates. 
    // However, if items are not re-rendered, we might need to force it.
    // Actually, fetchItems() is not needed on currency change, just re-render.
  }, [currency]);

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiFetch("/work-entries", {
        method: "POST",
        body: {
          companyId: formData.companyId,
          date: formData.date,
          hours: Number(formData.hours),
          // Horas solamente: el backend permite hourlyRate opcional (default 0)
          hourlyRate: 0
        }
      });
      setIsModalOpen(false);
      setFormData((prev) => ({ ...prev, hours: "" }));
      fetchAll();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await apiFetch(`/work-entries/${id}`, {
        method: "DELETE"
      });
      // Remove from UI immediately
      setEntries((prev) => prev.filter((item) => item._id !== id));
    } catch (e) {
      alert(e.message || "Error al eliminar");
    } finally {
      setDeletingId(null);
    }
  };

  const receiptByCompanyId = useMemo(() => {
    const map = new Map();
    (receipts || []).forEach((r) => {
      const id = r.company?._id || r.company;
      if (id) map.set(String(id), r);
    });
    return map;
  }, [receipts]);

  const hoursByCompany = useMemo(() => {
    const map = new Map();
    (entries || []).forEach((e) => {
      const cid = e.company?._id || e.company;
      const name = e.company?.name;
      if (!cid) return;
      const key = String(cid);
      const prev = map.get(key) || { companyId: key, companyName: name || "Empresa", totalHours: 0 };
      prev.totalHours += Number(e.hours || 0);
      map.set(key, prev);
    });
    return Array.from(map.values()).sort((a, b) => String(a.companyName).localeCompare(String(b.companyName)));
  }, [entries]);

  const saveReceipt = async (companyId, amountReceived) => {
    setSavingCompanyId(companyId);
    try {
      await apiFetch("/income-receipts", {
        method: "POST",
        body: {
          companyId,
          month: Number(month),
          year: Number(year),
          amountReceived: parseMoneyDraft(amountReceived)
        }
      });
      await fetchAll();
    } catch (e) {
      alert(e.message || "Error al guardar el cobro");
    } finally {
      setSavingCompanyId(null);
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.875rem" }}>Mis ingresos</h1>
          <p style={{ color: "var(--color-text-secondary)" }}>
            Apunta horas por empresa y registra el dinero recibido al cierre de mes
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Añadir horas
        </Button>
      </div>

      {error && (
        <div style={{ marginBottom: "1rem", padding: "1rem", color: "var(--color-danger)", backgroundColor: "var(--color-danger-bg)", borderRadius: "var(--radius-md)" }}>
          {error}
        </div>
      )}

      <Card style={{ marginBottom: "2rem" }} padding="1rem">
        <div style={{ display: "flex", gap: "1rem", alignItems: "center", width: "100%" }}>
          <Filter size={18} color="var(--color-text-secondary)" />
          <select 
            value={month} 
            onChange={(e) => setMonth(e.target.value)}
            style={{ 
              padding: "0.5rem", 
              borderRadius: "var(--radius-sm)", 
              border: "1px solid var(--color-border)",
              flex: 1 // Take available space
            }}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('es-ES', { month: 'long' })}</option>
            ))}
          </select>
          <select 
            value={year} 
            onChange={(e) => setYear(e.target.value)}
            style={{ 
              padding: "0.5rem", 
              borderRadius: "var(--radius-sm)", 
              border: "1px solid var(--color-border)",
              flex: 1 // Take available space
            }}
          >
            <option value="2024">2024</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1rem" }}>
        <Card padding="0">
          <div style={{ padding: "1rem 1rem 0.25rem 1rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <Building2 size={18} />
              <div style={{ fontWeight: 850 }}>Horas del mes (por empresa)</div>
            </div>
          </div>
          <Table headers={["Empresa", "Horas (mes)", "Cobrado (mes)", "Acciones"]}>
            {loading ? (
              <TableRow><TableCell>Cargando...</TableCell></TableRow>
            ) : companies.length === 0 ? (
              <TableRow><TableCell className="text-secondary">Crea una empresa primero en “Deliveries / Empresas”</TableCell></TableRow>
            ) : (
              companies.map((c) => {
                const cid = String(c._id);
                const hoursRow = hoursByCompany.find((x) => x.companyId === cid);
                const receipt = receiptByCompanyId.get(cid);
                const amount = receipt?.amountReceived ?? "";
                const draft = receiptDrafts[cid] ?? formatReceiptDraft(amount);
                return (
                  <TableRow key={cid}>
                    <TableCell>{c.name}</TableCell>
                    <TableCell className="font-bold">{Number(hoursRow?.totalHours || 0).toFixed(2)} h</TableCell>
                    <TableCell className="font-bold text-success">
                      {amount === "" ? "-" : `+${formatCurrency(amount)}`}
                    </TableCell>
                    <TableCell>
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                        <input
                          value={draft}
                          onChange={(e) => setReceiptDrafts((prev) => ({ ...prev, [cid]: formatMoneyInput(e.target.value) }))}
                          inputMode="decimal"
                          placeholder=""
                          style={{
                            width: 140,
                            padding: "0.55rem 0.7rem",
                            borderRadius: "var(--radius-sm)",
                            border: "1px solid var(--color-border)",
                            background: "rgba(15, 23, 42, 0.18)",
                            color: "var(--color-text)"
                          }}
                          onChange={(e) => setReceiptDrafts((prev) => ({ ...prev, [cid]: e.target.value }))}
                          onKeyDown={async (e) => {
                            if (e.key !== "Enter") return;
                            await saveReceipt(cid, e.currentTarget.value);
                          }}
                        />
                        <button
                          type="button"
                          title="Guardar cobro (se refleja en Banco)"
                          onClick={async () => {
                            await saveReceipt(cid, receiptDrafts[cid] ?? "0");
                          }}
                          disabled={savingCompanyId === cid}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 38,
                            height: 38,
                            borderRadius: 10,
                            border: "1px solid var(--color-border)",
                            background: "rgba(15, 23, 42, 0.18)",
                            cursor: savingCompanyId === cid ? "wait" : "pointer",
                            opacity: savingCompanyId === cid ? 0.6 : 1
                          }}
                        >
                          <Save size={18} />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </Table>
        </Card>

        <Card padding="0">
          <div style={{ padding: "1rem 1rem 0.25rem 1rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" }}>
            <div style={{ fontWeight: 850 }}>Detalle de horas (por día)</div>
          </div>
          <Table headers={["Fecha", "Empresa", "Horas", "Acciones"]}>
          {loading ? (
            <TableRow><TableCell>Cargando...</TableCell></TableRow>
          ) : entries.length === 0 ? (
            <TableRow><TableCell className="text-secondary">No hay horas registradas en este periodo</TableCell></TableRow>
          ) : (
            entries.map(item => (
              <TableRow key={item._id}>
                <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                <TableCell>{item.company?.name || "-"}</TableCell>
                <TableCell className="font-bold">{Number(item.hours || 0).toFixed(2)} h</TableCell>
                <TableCell>
                  <button 
                    onClick={() => handleDelete(item._id)}
                    disabled={deletingId === item._id}
                    style={{ 
                      background: "none", 
                      border: "none", 
                      cursor: deletingId === item._id ? "wait" : "pointer", 
                      color: "var(--color-danger)",
                      opacity: deletingId === item._id ? 0.5 : 1,
                      padding: "0.25rem"
                    }}
                    title="Eliminar ingreso"
                  >
                    <Trash2 size={18} />
                  </button>
                </TableCell>
              </TableRow>
            ))
          )}
        </Table>
        </Card>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Añadir horas">
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--color-text-secondary)" }}>Empresa</label>
            <select
              value={formData.companyId}
              onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
              style={{ padding: "0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", width: "100%" }}
              required
            >
              {companies.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
          <Input 
            label="Fecha" 
            type="date" 
            value={formData.date} 
            onChange={(e) => setFormData({...formData, date: e.target.value})}
            required
          />
          <Input 
            label="Horas" 
            type="number" 
            value={formData.hours} 
            onChange={(e) => setFormData({...formData, hours: e.target.value})}
            placeholder="0.0"
            step="0.25"
            min="0"
            required
          />
          <Button type="submit" style={{ marginTop: "1rem" }}>Guardar horas</Button>
        </form>
      </Modal>
    </div>
  );
}
