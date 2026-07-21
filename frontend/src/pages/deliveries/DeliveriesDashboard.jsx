import { useState, useEffect, useMemo, useCallback } from "react";
import { apiFetch } from "../../lib/api";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { useCurrency } from "../../context/CurrencyContext";
import { 
  Briefcase, 
  Calendar as CalendarIcon, 
  Plus, 
  Trash2, 
  Edit2, 
  ChevronLeft,
  ChevronRight,
  FileText,
  Lock,
  AlertTriangle,
  Save,
  Upload
} from "lucide-react";

const MONEY_PATTERN = /-?\d{1,3}(?:[.\s]\d{3})*(?:[,.]\d{1,2})?|-?\d+(?:[,.]\d{1,2})?/g;

function parsePayrollNumber(value) {
  const raw = String(value ?? "").trim().replace(/\s/g, "").replace(/[^\d.,-]/g, "");
  if (!raw) return null;
  const lastComma = raw.lastIndexOf(",");
  const lastDot = raw.lastIndexOf(".");
  let normalized = raw;

  if (lastComma > -1 && lastDot > -1) {
    normalized = lastComma > lastDot
      ? raw.replace(/\./g, "").replace(",", ".")
      : raw.replace(/,/g, "");
  } else if (lastComma > -1) {
    normalized = raw.replace(",", ".");
  } else {
    normalized = raw.replace(/\.(?=\d{3}(?:\.|$))/g, "");
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizePayrollText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function compactNumber(value) {
  if (!Number.isFinite(value)) return "";
  return Number(value.toFixed(2)).toString();
}

function lineValue(lines, keywordGroups, { max = 100000, min = 0 } = {}) {
  for (const line of lines) {
    const normalizedLine = normalizePayrollText(line);
    const matchesKeywords = keywordGroups.every((group) =>
      group.some((keyword) => normalizedLine.includes(keyword))
    );
    if (!matchesKeywords) continue;

    const values = Array.from(line.matchAll(MONEY_PATTERN))
      .map((match) => parsePayrollNumber(match[0]))
      .filter((number) => number !== null && number >= min && number <= max);

    if (values.length > 0) return values[values.length - 1];
  }
  return null;
}

function linePercent(lines, keywordGroups) {
  for (const line of lines) {
    const normalizedLine = normalizePayrollText(line);
    const matchesKeywords = keywordGroups.every((group) =>
      group.some((keyword) => normalizedLine.includes(keyword))
    );
    if (!matchesKeywords) continue;

    const match = line.match(/-?\d+(?:[,.]\d+)?\s*%/);
    if (!match) continue;
    const parsed = parsePayrollNumber(match[0]);
    if (parsed !== null) return parsed;
  }
  return null;
}

function sumLinePercents(lines, keywordGroupsList) {
  let total = 0;
  let found = false;
  keywordGroupsList.forEach((keywordGroups) => {
    const value = linePercent(lines, keywordGroups);
    if (value === null) return;
    total += value;
    found = true;
  });
  return found ? Number(total.toFixed(2)) : null;
}

function lineAmount(lines, keywordGroups) {
  for (const line of lines) {
    const normalizedLine = normalizePayrollText(line);
    const matchesKeywords = keywordGroups.every((group) =>
      group.some((keyword) => normalizedLine.includes(keyword))
    );
    if (!matchesKeywords) continue;

    const euroMatches = Array.from(line.matchAll(/-?\d{1,3}(?:[.\s]\d{3})*(?:[,.]\d{1,2})?\s*€|-?\d+(?:[,.]\d{1,2})?\s*€/g));
    const values = euroMatches
      .map((match) => parsePayrollNumber(match[0]))
      .filter((number) => number !== null && number >= 0);
    if (values.length > 0) return values[values.length - 1];
  }
  return null;
}

function sumLineAmounts(lines, keywordGroupsList) {
  let total = 0;
  let found = false;
  keywordGroupsList.forEach((keywordGroups) => {
    const value = lineAmount(lines, keywordGroups);
    if (value === null) return;
    total += value;
    found = true;
  });
  return found ? Number(total.toFixed(2)) : null;
}

function inferCompanyNameFromFile(fileName) {
  return String(fileName || "")
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\b(nomina|nómina|payroll|recibo|salario|salary)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function inferCompanyNameFromPayrollText(lines, fallback) {
  const companySuffix = /\b(?:s\.?\s*l\.?|s\.?\s*a\.?|slu|sl|sa|sll|coop)\b/i;
  for (const line of lines) {
    const cleaned = line
      .replace(/\b(trabajador|empresa|empleador)\b/gi, "")
      .replace(/\b(cif|dni|naf|domicilio|puesto|antiguedad)\b.*$/gi, "")
      .replace(/\s+/g, " ")
      .trim();
    if (cleaned.length < 4 || !companySuffix.test(cleaned)) continue;
    return cleaned;
  }
  return fallback;
}

function inferPayrollFields(text, fileName) {
  const lines = String(text || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const fallbackName = inferCompanyNameFromFile(fileName);
  const inferred = {
    name: inferCompanyNameFromPayrollText(lines, fallbackName),
    hourlyRateDefault: lineValue(lines, [["hora", "h."], ["normal", "ordinaria", "estandar"]], { max: 200 }),
    nightHourlyRateDefault: lineValue(lines, [["hora", "h.", "precio", "valor", "importe", "tarifa"], ["nocturn"]], { max: 200 }),
    deductions: {
      commonContingencies: linePercent(lines, [["contingencia"], ["comun"]]),
      unemploymentAccident: linePercent(lines, [["desempleo"]]),
      irpf: linePercent(lines, [["irpf"]]),
      other: sumLinePercents(lines, [
        [["mecanismo"], ["equidad"]],
        [["formacion"], ["profesional"]],
        [["otras", "otros"], ["deduccion", "deducciones"]]
      ])
    },
    supplements: {
      benefits: lineAmount(lines, [["beneficio", "beneficios"]]),
      agreementBonus: lineAmount(lines, [["plus"], ["convenio"]]),
      proratedPayments: lineAmount(lines, [["prorrata", "pagas"]]),
      voluntaryImprovement: lineAmount(lines, [["mejora"], ["voluntaria"]]),
      other: sumLineAmounts(lines, [
        [["plus"], ["festivo"]],
        [["hora", "horas"], ["extra", "extraordinaria"]],
        [["plus"], ["hora", "horas"], ["nocturn"]]
      ])
    }
  };

  if (inferred.hourlyRateDefault === null) {
    inferred.hourlyRateDefault = lineValue(lines, [["precio", "valor", "importe"], ["hora", "h."]], { max: 200 });
  }

  return inferred;
}

function hasUsefulPayrollText(text) {
  const normalized = normalizePayrollText(text);
  const keywords = ["irpf", "contingencia", "desempleo", "hora", "tarifa", "precio", "nocturn", "plus", "prorrata", "nomina"];
  return normalized.length > 120 && keywords.some((keyword) => normalized.includes(keyword));
}

async function extractPdfText(pdf) {
  const pages = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const rows = new Map();

    content.items.forEach((item) => {
      const [, , , , x, y] = item.transform || [];
      const rowKey = Math.round(Number(y || 0) / 4) * 4;
      if (!rows.has(rowKey)) rows.set(rowKey, []);
      rows.get(rowKey).push({ x: Number(x || 0), text: item.str });
    });

    const pageText = Array.from(rows.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([, items]) => items
        .sort((a, b) => a.x - b.x)
        .map((item) => item.text)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim()
      )
      .filter(Boolean)
      .join("\n");

    pages.push(pageText);
  }
  return pages.join("\n");
}

async function extractPdfTextWithOcr(pdf, onProgress) {
  const { createWorker } = await import("tesseract.js");
  onProgress?.("PDF sin texto claro. Aplicando OCR...");
  const worker = await createWorker("spa+eng", 1, {
    logger: (message) => {
      if (message.status === "recognizing text") {
        onProgress?.(`Reconociendo nómina... ${Math.round((message.progress || 0) * 100)}%`);
      }
    }
  });

  try {
    const pages = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      onProgress?.(`Analizando página ${pageNumber} de ${pdf.numPages}...`);
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 2.2 });
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ canvasContext: context, viewport }).promise;
      const { data } = await worker.recognize(canvas);
      pages.push(data.text || "");
    }
    return pages.join("\n");
  } finally {
    await worker.terminate();
  }
}

async function extractImageText(file, onProgress) {
  const { createWorker } = await import("tesseract.js");
  onProgress?.("Aplicando OCR a la imagen...");
  const worker = await createWorker("spa+eng", 1, {
    logger: (message) => {
      if (message.status === "recognizing text") {
        onProgress?.(`Reconociendo nómina... ${Math.round((message.progress || 0) * 100)}%`);
      }
    }
  });
  const url = URL.createObjectURL(file);

  try {
    const { data } = await worker.recognize(url);
    return data.text || "";
  } finally {
    URL.revokeObjectURL(url);
    await worker.terminate();
  }
}

async function extractPayrollText(file, onProgress) {
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    const pdfjsLib = await import("pdfjs-dist");
    const worker = await import("pdfjs-dist/build/pdf.worker.mjs?url");
    pdfjsLib.GlobalWorkerOptions.workerSrc = worker.default;

    const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
    onProgress?.("Leyendo texto del PDF...");
    const text = await extractPdfText(pdf);
    if (hasUsefulPayrollText(text)) return text;
    return extractPdfTextWithOcr(pdf, onProgress);
  }

  if (file.type.startsWith("image/") || /\.(png|jpe?g|webp)$/i.test(file.name)) {
    return extractImageText(file, onProgress);
  }

  if (file.type.startsWith("text/") || /\.(txt|csv)$/i.test(file.name)) {
    return file.text();
  }

  throw new Error("Formato no compatible. Usa PDF, imagen o TXT.");
}

export default function DeliveriesDashboard() {
  const { formatCurrency } = useCurrency();
  const [stats, setStats] = useState(null);
  const [entries, setEntries] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date()); // For month navigation
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  }); // Selected specific day (UTC midnight)

  // Closing State
  const [isMonthClosed, setIsMonthClosed] = useState(false);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState("");

  // Modal State
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isReceiptsModalOpen, setIsReceiptsModalOpen] = useState(false);

  const [receiptDrafts, setReceiptDrafts] = useState({});
  const [extraReceiptEnabled, setExtraReceiptEnabled] = useState({});
  const [savingCompanyId, setSavingCompanyId] = useState(null);
  
  // Form State
  const [entryForm, setEntryForm] = useState({
    companyId: "",
    hours: "",
    hourlyRate: "",
    notes: ""
  });

  const [companyFormMode, setCompanyFormMode] = useState("simple");
  const [payrollImportStatus, setPayrollImportStatus] = useState({ type: "idle", message: "" });

  const [companyForm, setCompanyForm] = useState({
    id: null,
    name: "",
    hourlyRateDefault: "",
    nightHourlyRateDefault: "",
    description: "",
    deductions: {
      commonContingencies: 4.85,
      unemploymentAccident: 1.65,
      irpf: 20.0,
      other: 0,
      otherConcept: ""
    },
    supplements: {
      benefits: 0,
      agreementBonus: 0,
      proratedPayments: 0,
      voluntaryImprovement: 0,
      other: 0
    },
    limitRule: {
      enabled: false,
      amount: 1600
    }
  });

  // Initial Load (removed to prevent duplicate with currentDate effect)

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

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Use UTC dates to match backend storage (which saves YYYY-MM-DD as UTC midnight)
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      
      // Start of month in UTC
      const from = new Date(Date.UTC(year, month, 1)).toISOString();
      // End of month in UTC (last millisecond of the month)
      const to = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999)).toISOString();

      const [statsRes, entriesRes, bankRes, receiptsRes] = await Promise.all([
        apiFetch(`/work-entries/stats?from=${from}&to=${to}&syncRates=1`),
        apiFetch(`/work-entries?from=${from}&to=${to}&syncRates=1`),
        apiFetch(`/bank?month=${month + 1}&year=${year}`), // Check if month is closed
        apiFetch(`/income-receipts?month=${month + 1}&year=${year}`)
      ]);

      setStats(statsRes.data);
      setEntries(entriesRes.data);
      setReceipts(receiptsRes.data || []);

      setReceiptDrafts((prev) => {
        const next = { ...prev };
        (receiptsRes.data || []).forEach((r) => {
          const cid = r.company?._id || r.company;
          if (!cid) return;
          const key = String(cid);
          if (next[key] === undefined) {
            next[key] = {
              payroll: formatReceiptDraft(r.payrollAmount ?? r.amountReceived),
              extra: formatReceiptDraft(r.extraAmount)
            };
          }
        });
        return next;
      });

      setExtraReceiptEnabled((prev) => {
        const next = { ...prev };
        (receiptsRes.data || []).forEach((r) => {
          const cid = r.company?._id || r.company;
          if (!cid) return;
          const key = String(cid);
          if (next[key] === undefined && Number(r.extraAmount || 0) > 0) {
            next[key] = true;
          }
        });
        return next;
      });
      
      // Check closing status
      const isClosed = bankRes.data?.closings?.some(c => c.month === month + 1 && c.year === year);
      setIsMonthClosed(!!isClosed);

    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }, [currentDate]);


  const fetchCompanies = useCallback(async () => {
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const res = await apiFetch(`/companies?month=${month + 1}&year=${year}`);
      setCompanies(res.data);
    } catch (error) {
      console.error("Error loading companies:", error);
    }
  }, [currentDate]);

  useEffect(() => {
    fetchData();
    fetchCompanies();
  }, [fetchCompanies, fetchData]);

  const handleCreateEntry = async (e) => {
    e.preventDefault();
    try {
      await apiFetch("/work-entries", {
        method: "POST",
        body: {
          ...entryForm,
          hourlyRate: 0,
          date: selectedDate.toLocaleDateString('en-CA') // Force YYYY-MM-DD local
        }
      });
      
      // Reset form but keep company if desired? For now reset all
      setEntryForm({
        companyId: "",
        hours: "",
        hourlyRate: "",
        notes: ""
      });
      
      fetchData();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDelete = async (id) => {
    // Eliminar confirmación: if (!window.confirm("¿Eliminar registro?")) return;
    try {
      await apiFetch(`/work-entries/${id}`, { method: "DELETE" });
      fetchData();
    } catch (e) {
      alert(e.message);
    }
  };

  const handlePayrollUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setPayrollImportStatus({ type: "loading", message: "Leyendo nómina..." });
      const text = await extractPayrollText(file, (message) => {
        setPayrollImportStatus({ type: "loading", message });
      });
      const inferred = inferPayrollFields(text, file.name);
      const detected = [
        inferred.name ? "empresa" : null,
        inferred.hourlyRateDefault !== null ? "hora normal" : null,
        inferred.nightHourlyRateDefault !== null ? "hora nocturna" : null,
        ...Object.entries(inferred.deductions)
          .filter(([, value]) => value !== null)
          .map(([key]) => key === "irpf" ? "IRPF" : "deducciones"),
        ...Object.entries(inferred.supplements)
          .filter(([, value]) => value !== null)
          .map(([key]) => key === "other" ? "extras" : "complementos")
      ].filter(Boolean);

      setCompanyFormMode("complete");
      setCompanyForm((prev) => {
        const next = {
          ...prev,
          name: prev.name || inferred.name,
          deductions: { ...prev.deductions },
          supplements: { ...prev.supplements }
        };

        if (inferred.hourlyRateDefault !== null) {
          next.hourlyRateDefault = compactNumber(inferred.hourlyRateDefault);
        }
        if (inferred.nightHourlyRateDefault !== null) {
          next.nightHourlyRateDefault = compactNumber(inferred.nightHourlyRateDefault);
        }

        Object.entries(inferred.deductions).forEach(([key, value]) => {
          if (value === null) return;
          next.deductions[key] = value;
        });

        Object.entries(inferred.supplements).forEach(([key, value]) => {
          if (value === null) return;
          next.supplements[key] = value;
        });

        return next;
      });

      const uniqueDetected = Array.from(new Set(detected));
      setPayrollImportStatus({
        type: uniqueDetected.length > 0 ? "success" : "warning",
        message: uniqueDetected.length > 0
          ? `Datos detectados: ${uniqueDetected.join(", ")}.`
          : "No se detectaron importes claros; revisa la nómina o introduce los datos manualmente."
      });
    } catch (error) {
      setPayrollImportStatus({ type: "error", message: error.message || "No se pudo leer la nómina." });
    } finally {
      event.target.value = "";
    }
  };

  // --- Company Management Handlers (Same as before) ---
  const handleSaveCompany = async (e) => {
    e.preventDefault();
    try {
      const isEdit = !!companyForm.id;
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const url = isEdit 
        ? `/companies/${companyForm.id}?month=${month + 1}&year=${year}` 
        : `/companies`;
      const method = isEdit ? "PATCH" : "POST";

      const isSimpleCreate = !isEdit && companyFormMode === "simple";
      const payload = isSimpleCreate ? {
        name: companyForm.name.trim(),
        hourlyRateDefault: 0,
        nightHourlyRateDefault: 0,
        description: "",
        deductions: {
          commonContingencies: 0,
          unemploymentAccident: 0,
          irpf: 0,
          other: 0,
          otherConcept: ""
        },
        supplements: {
          benefits: 0,
          agreementBonus: 0,
          proratedPayments: 0,
          voluntaryImprovement: 0,
          other: 0
        },
        limitRule: {
          enabled: false,
          amount: 0
        }
      } : {
        name: companyForm.name,
        hourlyRateDefault: companyForm.hourlyRateDefault,
        nightHourlyRateDefault: companyForm.nightHourlyRateDefault,
        description: companyForm.description,
        deductions: companyForm.deductions,
        supplements: companyForm.supplements,
        limitRule: companyForm.limitRule
      };

      await apiFetch(url, { method, body: payload });

      setIsCompanyModalOpen(false);
      resetCompanyForm();
      fetchCompanies();
      fetchData(); // Recargar los registros para reflejar el nuevo precio/hora
    } catch (error) {
      alert(error.message);
    }
  };

  const resetCompanyForm = () => {
    setCompanyForm({
      id: null,
      name: "",
      hourlyRateDefault: "",
      nightHourlyRateDefault: "",
      description: "",
      deductions: {
        commonContingencies: 4.85,
        unemploymentAccident: 1.65,
        irpf: 20.0,
        other: 0,
        otherConcept: ""
      },
      supplements: {
        benefits: 0,
        agreementBonus: 0,
        proratedPayments: 0,
        voluntaryImprovement: 0,
        other: 0
      },
      limitRule: {
        enabled: false,
        amount: 1600
      }
    });
    setCompanyFormMode("simple");
    setPayrollImportStatus({ type: "idle", message: "" });
  };

  const handleEditCompany = (company) => {
    setCompanyFormMode("complete");
    setPayrollImportStatus({ type: "idle", message: "" });
    setCompanyForm({
      id: company._id,
      name: company.name,
      hourlyRateDefault: company.hourlyRateDefault,
      nightHourlyRateDefault: company.nightHourlyRateDefault ?? "",
      description: company.description || "",
      deductions: {
        commonContingencies: company.deductions?.commonContingencies ?? 4.85,
        unemploymentAccident: company.deductions?.unemploymentAccident ?? 1.65,
        irpf: company.deductions?.irpf ?? 20.0,
        other: company.deductions?.other ?? 0,
        otherConcept: company.deductions?.otherConcept || ""
      },
      supplements: {
        benefits: company.supplements?.benefits ?? 0,
        agreementBonus: company.supplements?.agreementBonus ?? 0,
        proratedPayments: company.supplements?.proratedPayments ?? 0,
        voluntaryImprovement: company.supplements?.voluntaryImprovement ?? 0,
        other: company.supplements?.other ?? 0
      },
      limitRule: {
        enabled: company.limitRule?.enabled ?? false,
        amount: company.limitRule?.amount ?? 1600
      }
    });
    setIsCompanyModalOpen(true);
  };

  const handleDeleteCompany = async (id) => {
    if (!window.confirm("¿Eliminar empresa?")) return;
    try {
      await apiFetch(`/companies/${id}`, { method: "DELETE" });
      fetchCompanies();
    } catch (error) {
      alert(error.message);
    }
  };

    const ymdUTC = (d) => {
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, "0");
      const day = String(d.getUTCDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };

    // Filter entries for the selected date
    const selectedDateEntries = useMemo(() => {
      const selectedKey = ymdUTC(selectedDate);
      return entries.filter(e => ymdUTC(new Date(e.date)) === selectedKey);
    }, [entries, selectedDate]);

    // Calendar Generation
    const calendarDays = useMemo(() => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(Date.UTC(year, month, 1));
      const lastDay = new Date(Date.UTC(year, month + 1, 0));
      
      const days = [];
      
      // Fill previous month days (Lunes = 1, Domingo = 0 en getDay())
      // Queremos que la semana empiece en Lunes
      // getDay(): Dom=0, Lun=1, Mar=2...
      // Si es Lunes(1), padding=0. Si es Domingo(0), padding=6.
      let startPadding = firstDay.getDay() - 1;
      if (startPadding === -1) startPadding = 6;
      
      for (let i = 0; i < startPadding; i++) {
        days.push(null);
      }
      
      // Fill current month days
      for (let i = 1; i <= lastDay.getUTCDate(); i++) {
        days.push(new Date(Date.UTC(year, month, i)));
      }
      
      return days;
    }, [currentDate]);

    const hasEntryOnDate = (date) => {
      if (!date) return false;
      const key = ymdUTC(date);
      return entries.some(e => ymdUTC(new Date(e.date)) === key);
    };

    const getDayTotal = (date) => {
      if (!date) return 0;
      const key = ymdUTC(date);
      return entries
        .filter(e => ymdUTC(new Date(e.date)) === key)
        .reduce((sum, e) => sum + (e.hours || 0), 0);
    };

  const handleUnlockMonth = async (e) => {
    e.preventDefault();
    try {
      await apiFetch("/bank/open", {
        method: "POST",
        body: { 
          month: currentDate.getMonth() + 1, 
          year: currentDate.getFullYear(),
          password: unlockPassword
        }
      });
      setIsUnlockModalOpen(false);
      setUnlockPassword("");
      fetchData(); // Refresh
    } catch (e) {
      alert(e.message);
    }
  };

  const totalReceivedThisMonth = useMemo(() => {
    return (receipts || []).reduce((sum, r) => sum + Number(r.amountReceived || 0), 0);
  }, [receipts]);

  const parseMoneyDraft = (value) => {
    const raw = String(value ?? "").trim().replace(/[^\d.,]/g, "");
    if (!raw) return 0;
    const parsed = raw.includes(",")
      ? Number(raw.replace(/\./g, "").replace(",", "."))
      : Number(raw.replace(/\.(?=\d{3}(?:\.|$))/g, ""));
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  };

  const avgHoursPerWorkedDay = useMemo(() => {
    const days = new Set();
    (entries || []).forEach((e) => {
      const d = new Date(e.date);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      days.add(key);
    });
    const workedDays = Math.max(1, days.size);
    const totalHours = Number(stats?.totalHours || 0);
    return totalHours / workedDays;
  }, [entries, stats]);

  const saveReceipt = async (companyId) => {
    setSavingCompanyId(companyId);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const draft = receiptDrafts[String(companyId)] || {};
      const isExtraEnabled = !!extraReceiptEnabled[String(companyId)];
      await apiFetch("/income-receipts", {
        method: "POST",
        body: {
          companyId,
          year,
          month,
          payrollAmount: parseMoneyDraft(draft.payroll),
          extraAmount: isExtraEnabled ? parseMoneyDraft(draft.extra) : 0
        }
      });
      await fetchData();
    } catch (e) {
      alert(e.message || "Error al guardar el cobro");
    } finally {
      setSavingCompanyId(null);
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: "5rem", maxWidth: "1200px", margin: "0 auto" }}>
      {loading && (
        <div style={{ padding: "1rem", color: "var(--color-text-secondary)" }}>
          Cargando...
        </div>
      )}
      
      {/* 1. Header & Controls */}
      <div style={{ marginBottom: "1.5rem" }}>
        {/* Top Row: Title & Date Nav */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Briefcase className="text-primary" size={24} /> 
              H & C
            </h1>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>
              {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase()}
            </p>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", backgroundColor: "var(--color-surface)", borderRadius: "var(--radius-md)", padding: "0.25rem", border: "1px solid var(--color-border)" }}>
             <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text)", padding: "0.25rem" }}>
              <ChevronLeft size={18} />
            </button>
            <span style={{ fontSize: "0.875rem", fontWeight: 600, minWidth: "80px", textAlign: "center" }}>
              {currentDate.toLocaleDateString('es-ES', { month: 'short' })}
            </span>
            <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text)", padding: "0.25rem" }}>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Bottom Row: Actions (Centered & Responsive) */}
        <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          {isMonthClosed ? (
            <Button variant="outline" size="sm" onClick={() => setIsUnlockModalOpen(true)} style={{ borderColor: "var(--color-warning)", color: "var(--color-warning)" }}>
              <Lock size={16} style={{ marginRight: "0.5rem" }} /> Mes Cerrado
            </Button>
          ) : null}

          <Button variant="outline" size="sm" onClick={() => { resetCompanyForm(); setIsCompanyModalOpen(true); }}>
            Empresas
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsReceiptsModalOpen(true)}>
            Cobros
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsSummaryModalOpen(true)}>
            <FileText size={16} style={{ marginRight: "0.5rem" }} /> Resumen
          </Button>
        </div>
      </div>
      
      {isMonthClosed && (
        <div style={{ 
          marginBottom: "1rem", padding: "0.75rem", 
          backgroundColor: "var(--color-warning-bg)", border: "1px solid var(--color-warning)", 
          borderRadius: "var(--radius-md)", color: "var(--color-warning)",
          display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem"
        }}>
          <Lock size={16} />
          <span>Este mes está cerrado. Para editarlo, desbloquéalo con tu contraseña.</span>
        </div>
      )}

      {/* 2. Minimal Summary Row (Space Saving) */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        padding: "0.75rem 0.5rem", 
        marginBottom: "1rem",
        backgroundColor: "var(--color-surface)",
        borderBottom: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        gap: "0.5rem"
      }}>
        <div style={{ textAlign: "center", flex: 1 }}>
          <span style={{ fontSize: "0.7rem", color: "var(--color-text-secondary)", display: "block", textTransform: "uppercase" }}>Cobrado</span>
          <span style={{ fontSize: "1rem", fontWeight: "bold", color: "var(--color-success)" }}>
            {formatCurrency(totalReceivedThisMonth)}
          </span>
        </div>
        
        <div style={{ width: "1px", height: "24px", backgroundColor: "var(--color-border)" }}></div>

        <div style={{ textAlign: "center", flex: 1 }}>
          <span style={{ fontSize: "0.7rem", color: "var(--color-text-secondary)", display: "block", textTransform: "uppercase" }}>Horas</span>
          <span style={{ fontSize: "1rem", fontWeight: "bold", color: "var(--color-info)" }}>
            {stats?.totalHours || 0}h
          </span>
        </div>

        <div style={{ width: "1px", height: "24px", backgroundColor: "var(--color-border)" }}></div>

        <div style={{ textAlign: "center", flex: 1 }}>
          <span style={{ fontSize: "0.7rem", color: "var(--color-text-secondary)", display: "block", textTransform: "uppercase" }}>Promedio</span>
          <span style={{ fontSize: "1rem", fontWeight: "bold", color: "var(--color-warning)" }}>{avgHoursPerWorkedDay.toFixed(1)}h</span>
        </div>

        {/* Neto/nomina no aplica en modo horas + cobros */}
      </div>

      {/* 3. Main Content Grid: Calendar Only */}
      <div style={{ 
        paddingBottom: "2rem"
      }}>
        
        {/* Interactive Calendar (Full Width) */}
        <div style={{ 
          backgroundColor: "var(--color-surface)", 
          padding: "0.75rem", 
          borderRadius: "var(--radius-lg)", 
          border: "1px solid var(--color-border)", 
          boxShadow: "var(--shadow-sm)"
        }}>
          <h3 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <CalendarIcon size={16} /> Calendario
          </h3>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", textAlign: "center", marginBottom: "0.25rem" }}>
            {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
              <div key={i} style={{ fontSize: "0.65rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>{d}</div>
            ))}
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
            {calendarDays.map((day, idx) => {
              if (!day) return <div key={idx} />;
              
              const isSelected = ymdUTC(day) === ymdUTC(selectedDate);
              const now = new Date();
              const isToday = ymdUTC(day) === ymdUTC(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())));
              const hasData = hasEntryOnDate(day);
              const dayTotal = getDayTotal(day);

              return (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedDate(day);
                    setIsDetailsModalOpen(true);
                  }}
                  style={{
                    aspectRatio: "1",
                    borderRadius: "var(--radius-sm)",
                    border: isSelected ? "1.5px solid var(--color-primary)" : "1px solid transparent",
                    backgroundColor: isSelected ? "var(--color-primary-light)" : "var(--color-background)",
                    color: isSelected ? "var(--color-primary)" : "var(--color-text)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    position: "relative",
                    transition: "all 0.1s",
                    padding: "0.1rem"
                  }}
                >
                  <span style={{ fontSize: "0.75rem", fontWeight: isToday ? "bold" : "normal" }}>
                    {day.getUTCDate()}
                  </span>
                  {hasData && (
                    <div style={{ marginTop: "0px", fontSize: "0.5rem", fontWeight: 600, color: "var(--color-success)", lineHeight: 1 }}>
                    {Number(dayTotal || 0).toFixed(1)}h
                  </div>
                  )}
                  {isToday && !isSelected && (
                    <div style={{ position: "absolute", bottom: "2px", width: "3px", height: "3px", borderRadius: "50%", backgroundColor: "var(--color-primary)" }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Summary Modal */}
      <Modal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        title="Resumen Detallado"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ padding: "1rem", backgroundColor: "var(--color-surface)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
            <h4 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "0.5rem" }}>RESUMEN DEL MES</h4>
            <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--color-text)" }}>
              {Number(stats?.totalHours || 0).toFixed(1)}h
            </div>
            <div style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
              Cobrado: {formatCurrency(totalReceivedThisMonth)}
            </div>
          </div>
        </div>
      </Modal>

      {/* Receipts Modal */}
      <Modal
        isOpen={isReceiptsModalOpen}
        onClose={() => setIsReceiptsModalOpen(false)}
        title="Cobros del mes (guardar envia a Banco)"
      >
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {companies.length === 0 ? (
            <div style={{ color: "var(--color-text-secondary)" }}>No tienes empresas creadas.</div>
          ) : (
            companies.map((c) => {
              const cid = String(c._id);
              const draft = receiptDrafts[cid] || { payroll: "", extra: "" };
              const payrollValue = draft.payroll ?? "";
              const extraValue = draft.extra ?? "";
              const isExtraEnabled = !!extraReceiptEnabled[cid];
              const totalDraft = parseMoneyDraft(payrollValue) + (isExtraEnabled ? parseMoneyDraft(extraValue) : 0);
              return (
                <div key={cid} style={{ display: "grid", gap: "0.75rem", padding: "0.85rem", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", background: "var(--color-surface)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{ fontWeight: 800, minWidth: 0 }}>{c.name}</div>
                    <div style={{ color: "var(--color-success)", fontWeight: 800, whiteSpace: "nowrap" }}>
                      {formatCurrency(totalDraft)}
                    </div>
                  </div>

                  <label style={{ display: "grid", gap: "0.35rem" }}>
                    <span style={{ color: "var(--color-text-secondary)", fontSize: "0.82rem", fontWeight: 700 }}>Nómina</span>
                    <input
                      value={payrollValue}
                      onChange={(e) => setReceiptDrafts((prev) => ({
                        ...prev,
                        [cid]: { ...(prev[cid] || {}), payroll: formatMoneyInput(e.target.value) }
                      }))}
                      inputMode="decimal"
                      placeholder=""
                      style={{
                        width: "100%",
                        padding: "0.6rem 0.75rem",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--color-border)",
                        background: "rgba(15, 23, 42, 0.18)",
                        color: "var(--color-text)"
                      }}
                    />
                  </label>

                  {isExtraEnabled ? (
                    <label style={{ display: "grid", gap: "0.35rem", padding: "0.7rem", border: "1px solid rgba(148, 163, 184, 0.14)", borderRadius: "var(--radius-md)", background: "rgba(15, 23, 42, 0.12)" }}>
                      <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", color: "var(--color-text-secondary)", fontSize: "0.82rem", fontWeight: 700 }}>
                        Cobro extra
                        <button
                          type="button"
                          onClick={() => {
                            setExtraReceiptEnabled((prev) => ({ ...prev, [cid]: false }));
                            setReceiptDrafts((prev) => ({
                              ...prev,
                              [cid]: { ...(prev[cid] || {}), extra: "" }
                            }));
                          }}
                          style={{
                            border: 0,
                            background: "transparent",
                            color: "var(--color-text-secondary)",
                            cursor: "pointer",
                            fontWeight: 700,
                            fontSize: "0.78rem"
                          }}
                        >
                          Quitar
                        </button>
                      </span>
                      <input
                        value={extraValue}
                        onChange={(e) => setReceiptDrafts((prev) => ({
                          ...prev,
                          [cid]: { ...(prev[cid] || {}), extra: formatMoneyInput(e.target.value) }
                        }))}
                        inputMode="decimal"
                        placeholder=""
                        style={{
                          width: "100%",
                          padding: "0.6rem 0.75rem",
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid var(--color-border)",
                          background: "rgba(15, 23, 42, 0.18)",
                          color: "var(--color-text)"
                        }}
                      />
                    </label>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setExtraReceiptEnabled((prev) => ({ ...prev, [cid]: true }))}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.5rem",
                        width: "100%",
                        minHeight: 40,
                        borderRadius: 12,
                        border: "1px dashed var(--color-border)",
                        background: "rgba(15, 23, 42, 0.12)",
                        color: "var(--color-text-secondary)",
                        cursor: "pointer",
                        fontWeight: 800
                      }}
                    >
                      <Plus size={16} />
                      Añadir cobro extra
                    </button>
                  )}

                  <button
                    type="button"
                    title="Guardar"
                    onClick={() => saveReceipt(cid)}
                    disabled={savingCompanyId === cid}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem",
                      width: "100%",
                      minHeight: 42,
                      borderRadius: 12,
                      border: "1px solid var(--color-border)",
                      background: "rgba(15, 23, 42, 0.18)",
                      color: "var(--color-text)",
                      cursor: savingCompanyId === cid ? "wait" : "pointer",
                      opacity: savingCompanyId === cid ? 0.6 : 1,
                      fontWeight: 800
                    }}
                  >
                    <Save size={18} />
                    Guardar en Banco
                  </button>
                </div>
              );
            })
          )}
        </div>
      </Modal>

      {/* Details Modal */}
      <Modal 
        isOpen={isDetailsModalOpen} 
        onClose={() => setIsDetailsModalOpen(false)} 
        title={selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          
          {/* List of Entries for Selected Date */}
          {selectedDateEntries.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
               {selectedDateEntries.map(entry => (
                 <div key={entry._id} style={{ 
                   display: "flex", justifyContent: "space-between", alignItems: "center", 
                   padding: "1rem", backgroundColor: "var(--color-surface)", 
                   borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)"
                 }}>
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>{entry.company?.name || "Empresa"}</div>
                      <div style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
                        {entry.hours}h
                      </div>
                      {entry.notes && <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginTop: "0.25rem" }}>"{entry.notes}"</div>}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: "bold", color: "var(--color-success)", fontSize: "1.125rem" }}>
                        {Number(entry.hours || 0).toFixed(1)}h
                      </div>
                      <button 
                        onClick={() => handleDelete(entry._id)}
                        disabled={isMonthClosed}
                        style={{ 
                          background: "none", 
                          border: "none", 
                          color: isMonthClosed ? "var(--color-text-secondary)" : "var(--color-danger)", 
                          cursor: isMonthClosed ? "not-allowed" : "pointer", 
                          fontSize: "0.75rem", 
                          marginTop: "0.25rem", 
                          textDecoration: isMonthClosed ? "none" : "underline" 
                        }}
                      >
                        Eliminar
                      </button>
                    </div>
                 </div>
               ))}
            </div>
          )}

          {/* Add Entry Form */}
          <div style={{ 
            backgroundColor: "var(--color-surface)", 
            borderRadius: "var(--radius-md)", 
            padding: "0", 
            opacity: isMonthClosed ? 0.5 : 1,
            pointerEvents: isMonthClosed ? "none" : "auto"
          }}>
             <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>
               {selectedDateEntries.length > 0 ? "Añadir otro registro" : "Registrar actividad"}
             </h3>
             <form onSubmit={handleCreateEntry} style={{ display: "grid", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>EMPRESA</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "0.5rem" }}>
                    {companies.map(c => {
                      const isSelected = entryForm.companyId === c._id;
                      return (
                        <div 
                          key={c._id}
                          onClick={() => {
                            setEntryForm({
                              ...entryForm,
                              companyId: c._id,
                              hourlyRate: 0
                            });
                          }}
                          style={{
                            padding: "0.75rem",
                            borderRadius: "var(--radius-md)",
                            border: isSelected ? "2px solid var(--color-primary)" : "1px solid var(--color-border)",
                            backgroundColor: isSelected ? "var(--color-primary-light)" : "var(--color-surface)",
                            color: isSelected ? "var(--color-primary)" : "var(--color-text)",
                            cursor: "pointer",
                            textAlign: "center",
                            fontSize: "0.875rem",
                            fontWeight: isSelected ? 600 : 400,
                            transition: "all 0.2s"
                          }}
                        >
                          {c.name}
                        </div>
                      );
                    })}
                    {companies.length === 0 && <p style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>No hay empresas. Añade una arriba.</p>}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <Input 
                    label="HORAS" 
                    type="number" step="0.1" required 
                    placeholder="0.0"
                    value={entryForm.hours}
                    onChange={(e) => setEntryForm({...entryForm, hours: e.target.value})}
                  />
                </div>

                <Input 
                  label="NOTAS" 
                  placeholder="Opcional..."
                  value={entryForm.notes}
                  onChange={(e) => setEntryForm({...entryForm, notes: e.target.value})}
                />

                <Button type="submit" disabled={companies.length === 0 || !entryForm.companyId || !entryForm.hours} style={{ width: "100%" }}>
                  <Plus size={16} style={{ marginRight: "0.5rem" }} /> 
                  Guardar
                </Button>
             </form>
          </div>
        </div>
      </Modal>

      {/* Modal: Unlock Month */}
      <Modal 
        isOpen={isUnlockModalOpen} 
        onClose={() => setIsUnlockModalOpen(false)} 
        title="Desbloquear Mes"
      >
        <form onSubmit={handleUnlockMonth} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ textAlign: "center", color: "var(--color-warning)" }}>
            <div style={{ margin: "0 auto 1rem", width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "var(--color-warning-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Lock size={24} />
            </div>
            <p style={{ fontWeight: 600 }}>Mes Protegido</p>
            <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", marginTop: "0.5rem" }}>
              Introduce tu contraseña para desbloquear este mes.
            </p>
          </div>

          <div style={{ padding: "1rem", backgroundColor: "var(--color-surface)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-warning)", fontSize: "0.875rem" }}>
            <strong style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-warning)", marginBottom: "0.5rem" }}>
              <AlertTriangle size={16} /> Advertencia
            </strong>
            Al desbloquear, el saldo transferido al Banco se revertirá. Si haces cambios en la nómina, deberás volver a cerrar el mes para actualizar el Banco.
          </div>

          <Input 
            label="Contraseña" 
            type="password" 
            placeholder="Tu contraseña de acceso"
            value={unlockPassword}
            onChange={(e) => setUnlockPassword(e.target.value)}
            required
          />

          <div style={{ display: "flex", gap: "1rem" }}>
            <Button type="button" variant="ghost" onClick={() => setIsUnlockModalOpen(false)} style={{ flex: 1 }}>Cancelar</Button>
            <Button type="submit" variant="primary" style={{ flex: 1, backgroundColor: "var(--color-warning)", borderColor: "var(--color-warning)" }}>
              Desbloquear
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Create/Edit Company (Same as before) */}
      <Modal 
        isOpen={isCompanyModalOpen} 
        onClose={() => { setIsCompanyModalOpen(false); resetCompanyForm(); }} 
        title={companyForm.id ? "Editar Empresa" : "Nueva Empresa"}
      >
        <form onSubmit={handleSaveCompany} style={{ display: "grid", gap: "1rem" }}>
          {!companyForm.id && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", padding: "0.35rem", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", background: "rgba(15, 23, 42, 0.18)" }}>
              <Button
                type="button"
                variant={companyFormMode === "simple" ? "primary" : "ghost"}
                onClick={() => setCompanyFormMode("simple")}
              >
                Simple
              </Button>
              <Button
                type="button"
                variant={companyFormMode === "complete" ? "primary" : "ghost"}
                onClick={() => setCompanyFormMode("complete")}
              >
                Completo
              </Button>
            </div>
          )}

          <div style={{ display: "grid", gap: "0.55rem", padding: "0.85rem", border: "1px dashed var(--color-border)", borderRadius: "var(--radius-md)", background: "rgba(15, 23, 42, 0.14)" }}>
            <input
              id="company-payroll-upload"
              type="file"
              accept=".pdf,.txt,.csv,.png,.jpg,.jpeg,.webp,application/pdf,text/plain,image/*"
              onChange={handlePayrollUpload}
              style={{ display: "none" }}
            />
            <label
              htmlFor="company-payroll-upload"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                minHeight: 42,
                padding: "0.75rem 1rem",
                borderRadius: "var(--radius-full)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text)",
                background: "rgba(15, 23, 42, 0.22)",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              <Upload size={18} />
              Cargar nómina
            </label>
            {payrollImportStatus.message && (
              <div
                style={{
                  fontSize: "0.82rem",
                  color: payrollImportStatus.type === "error"
                    ? "var(--color-danger)"
                    : payrollImportStatus.type === "success"
                      ? "var(--color-success)"
                      : "var(--color-text-secondary)"
                }}
              >
                {payrollImportStatus.message}
              </div>
            )}
          </div>

          <Input 
            label="Nombre de la Empresa" required placeholder="Ej: MRJ..."
            value={companyForm.name} onChange={(e) => setCompanyForm({...companyForm, name: e.target.value})}
          />

          {(companyForm.id || companyFormMode === "complete") && (
            <>
              <Input 
                label={`Precio Hora Estándar (${formatCurrency(0).replace("0,00", "").trim()})`} type="number" step="0.01" required placeholder="Ej: 15.50"
                value={companyForm.hourlyRateDefault} onChange={(e) => setCompanyForm({...companyForm, hourlyRateDefault: e.target.value})}
              />
              <Input 
                label={`Precio Hora Nocturna (${formatCurrency(0).replace("0,00", "").trim()})`} type="number" step="0.01" placeholder="Ej: 18.00"
                value={companyForm.nightHourlyRateDefault} onChange={(e) => setCompanyForm({...companyForm, nightHourlyRateDefault: e.target.value})}
              />
              <Input 
                label="Descripción (Opcional)" placeholder="Notas..."
                value={companyForm.description} onChange={(e) => setCompanyForm({...companyForm, description: e.target.value})}
              />
              <hr style={{ border: "0", borderTop: "1px solid var(--color-border)", margin: "0.5rem 0" }} />
              <h3 style={{ fontSize: "1rem", fontWeight: 600 }}>Deducciones (%)</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <Input label="Contingencias" type="number" step="0.01" value={companyForm.deductions?.commonContingencies || 0} onChange={(e) => setCompanyForm({...companyForm, deductions: { ...companyForm.deductions, commonContingencies: parseFloat(e.target.value) || 0 }})} />
                <Input label="Desempleo" type="number" step="0.01" value={companyForm.deductions?.unemploymentAccident || 0} onChange={(e) => setCompanyForm({...companyForm, deductions: { ...companyForm.deductions, unemploymentAccident: parseFloat(e.target.value) || 0 }})} />
                <Input label="IRPF" type="number" step="0.01" value={companyForm.deductions?.irpf || 0} onChange={(e) => setCompanyForm({...companyForm, deductions: { ...companyForm.deductions, irpf: parseFloat(e.target.value) || 0 }})} />
                <Input label="Otras" type="number" step="0.01" value={companyForm.deductions?.other || 0} onChange={(e) => setCompanyForm({...companyForm, deductions: { ...companyForm.deductions, other: parseFloat(e.target.value) || 0 }})} />
              </div>
              <hr style={{ border: "0", borderTop: "1px solid var(--color-border)", margin: "0.5rem 0" }} />
              <h3 style={{ fontSize: "1rem", fontWeight: 600 }}>Complementos (Aumentan Nómina)</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <Input label={`Beneficios (${formatCurrency(0).replace("0,00", "").trim()})`} type="number" step="0.01" value={companyForm.supplements?.benefits || 0} onChange={(e) => setCompanyForm({...companyForm, supplements: { ...companyForm.supplements, benefits: parseFloat(e.target.value) || 0 }})} />
                <Input label={`Plus Convenio (${formatCurrency(0).replace("0,00", "").trim()})`} type="number" step="0.01" value={companyForm.supplements?.agreementBonus || 0} onChange={(e) => setCompanyForm({...companyForm, supplements: { ...companyForm.supplements, agreementBonus: parseFloat(e.target.value) || 0 }})} />
                <Input label={`Prorrata Pagas (${formatCurrency(0).replace("0,00", "").trim()})`} type="number" step="0.01" value={companyForm.supplements?.proratedPayments || 0} onChange={(e) => setCompanyForm({...companyForm, supplements: { ...companyForm.supplements, proratedPayments: parseFloat(e.target.value) || 0 }})} />
                <Input label={`Mejora Voluntaria (${formatCurrency(0).replace("0,00", "").trim()})`} type="number" step="0.01" value={companyForm.supplements?.voluntaryImprovement || 0} onChange={(e) => setCompanyForm({...companyForm, supplements: { ...companyForm.supplements, voluntaryImprovement: parseFloat(e.target.value) || 0 }})} />
                <Input label={`Otros (${formatCurrency(0).replace("0,00", "").trim()})`} type="number" step="0.01" value={companyForm.supplements?.other || 0} onChange={(e) => setCompanyForm({...companyForm, supplements: { ...companyForm.supplements, other: parseFloat(e.target.value) || 0 }})} />
              </div>
              <hr style={{ border: "0", borderTop: "1px solid var(--color-border)", margin: "0.5rem 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 600 }}>Límite Salarial</h3>
                <label style={{ display: "flex", gap: "0.5rem", fontSize: "0.875rem" }}>
                  <input type="checkbox" checked={companyForm.limitRule?.enabled || false} onChange={(e) => setCompanyForm({...companyForm, limitRule: { ...companyForm.limitRule, enabled: e.target.checked }})} /> Activar
                </label>
              </div>
              {companyForm.limitRule?.enabled && (
                 <Input label={`Límite (${formatCurrency(0).replace("0,00", "").trim()})`} type="number" step="0.01" value={companyForm.limitRule?.amount || 1600} onChange={(e) => setCompanyForm({...companyForm, limitRule: { ...companyForm.limitRule, amount: parseFloat(e.target.value) || 0 }})} />
              )}
            </>
          )}
          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            <Button type="button" variant="ghost" onClick={() => { setIsCompanyModalOpen(false); resetCompanyForm(); }} style={{ flex: 1 }}>Cancelar</Button>
            <Button type="submit" style={{ flex: 1 }}>Guardar</Button>
          </div>
        </form>
        {companies.length > 0 && !companyForm.id && (
          <div style={{ marginTop: "2rem", paddingTop: "1rem", borderTop: "1px solid var(--color-border)" }}>
            <h4 style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "1rem" }}>Empresas Existentes</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {companies.map(c => (
                <div key={c._id} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem", backgroundColor: "var(--color-surface)", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}>
                  <span onClick={() => handleEditCompany(c)} style={{ cursor: "pointer", flex: 1 }}>{c.name}</span>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <Edit2 size={16} onClick={() => handleEditCompany(c)} style={{ cursor: "pointer" }} />
                    <Trash2 size={16} color="var(--color-danger)" onClick={() => handleDeleteCompany(c._id)} style={{ cursor: "pointer" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
