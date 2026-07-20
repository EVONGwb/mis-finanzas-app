import { useEffect, useMemo, useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { apiFetch } from "../lib/api";
import { useCurrency } from "../context/CurrencyContext";

export default function Login({ onAuthed }) {
  const { formatCurrency } = useCurrency();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activePane, setActivePane] = useState("login"); // login | debt (mobile compact)
  const [isCompactMobile, setIsCompactMobile] = useState(false);
  const [debtCode, setDebtCode] = useState("");
  const [debtLoading, setDebtLoading] = useState(false);
  const [debtError, setDebtError] = useState("");
  const [debtData, setDebtData] = useState(null);

  useEffect(() => {
    const compute = () => {
      // Objetivo: que en móviles con poca altura no haya scroll.
      const compact = window.innerWidth <= 480 && window.innerHeight <= 760;
      setIsCompactMobile(compact);
      if (!compact) setActivePane("login");
    };
    compute();
    window.addEventListener("resize", compute);
    window.addEventListener("orientationchange", compute);
    return () => {
      window.removeEventListener("resize", compute);
      window.removeEventListener("orientationchange", compute);
    };
  }, []);

  // Logo final (fijo)
  const logoHeightMobile = 145; // px (max)
  const logoHeightDesktop = 220; // px (max)
  const logoScale = 160; // %

  const debtProgress = useMemo(() => {
    const pct = Number(debtData?.porcentajePagado);
    if (!Number.isFinite(pct)) return 0;
    return Math.max(0, Math.min(100, pct));
  }, [debtData]);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError("");
      try {
        const res = await apiFetch("/auth/google", {
          method: "POST",
          body: { accessToken: tokenResponse.access_token }
        });
        if (!res?.ok) throw new Error("Respuesta inválida del servidor");
        onAuthed();
      } catch (err) {
        setError(err?.message || "Error al iniciar sesión con Google");
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError("Error al conectar con Google")
  });

  const onDebtSubmit = async () => {
    if (debtLoading) return;
    setDebtLoading(true);
    setDebtError("");
    setDebtData(null);
    try {
      const codigo = String(debtCode || "").trim();
      if (!codigo) throw new Error("Introduce tu código de deuda");

      const attempts = [
        { path: "/credits/consultar", label: "Me Deben" },
        { path: "/debts/consultar", label: "Deudas" },
        { path: "/deuda/consultar", label: "Seguimiento" }
      ];

      let lastError = null;
      for (const attempt of attempts) {
        try {
          const res = await apiFetch(attempt.path, {
            method: "POST",
            body: { codigo }
          });
          if (!res?.ok) throw new Error("No se pudo consultar la deuda");
          setDebtData(res.data || null);
          lastError = null;
          break;
        } catch (e) {
          const msg = String(e?.message || "");
          if (msg.includes("404 - Código no encontrado")) {
            lastError = e;
            continue;
          }
          throw e;
        }
      }

      if (lastError) throw lastError;
    } catch (e) {
      setDebtError(e?.message || "No se pudo consultar la deuda");
    } finally {
      setDebtLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: isCompactMobile ? "0.75rem" : "clamp(0.9rem, 3vw, 1.5rem)",
        fontFamily: "var(--font-family)",
        position: "relative",
        overflowX: "hidden",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch"
      }}
    >
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(1200px 700px at 20% 15%, rgba(16, 185, 129, 0.16), transparent 55%), radial-gradient(1100px 650px at 80% 90%, rgba(34, 211, 238, 0.12), transparent 55%), radial-gradient(900px 600px at 50% 55%, rgba(59, 130, 246, 0.08), transparent 60%)", pointerEvents: "none" }} />
      <div
        style={{
          width: "100%",
          maxWidth: isCompactMobile ? "520px" : "720px",
          display: "flex",
          flexDirection: "column",
          gap: isCompactMobile ? "0.7rem" : "clamp(0.85rem, 2.6vw, 1.25rem)",
          position: "relative",
          minHeight: "100%",
          paddingBottom: isCompactMobile ? "0.5rem" : "clamp(1rem, 4vw, 2.25rem)"
        }}
      >
        {isCompactMobile && (
          <div
            style={{
              width: "100%",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.5rem",
              padding: "0.35rem",
              borderRadius: "16px",
              border: "1px solid rgba(148, 163, 184, 0.14)",
              backgroundColor: "rgba(6, 15, 23, 0.35)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)"
            }}
          >
            <button
              type="button"
              onClick={() => setActivePane("login")}
              style={{
                height: "42px",
                borderRadius: "12px",
                border: "1px solid rgba(148, 163, 184, 0.12)",
                backgroundColor: activePane === "login" ? "rgba(16, 185, 129, 0.92)" : "rgba(15, 23, 42, 0.18)",
                color: activePane === "login" ? "var(--color-text-inverse)" : "var(--color-text)",
                fontWeight: 900,
                cursor: "pointer"
              }}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setActivePane("debt")}
              style={{
                height: "42px",
                borderRadius: "12px",
                border: "1px solid rgba(148, 163, 184, 0.12)",
                backgroundColor: activePane === "debt" ? "rgba(16, 185, 129, 0.92)" : "rgba(15, 23, 42, 0.18)",
                color: activePane === "debt" ? "var(--color-text-inverse)" : "var(--color-text)",
                fontWeight: 900,
                cursor: "pointer"
              }}
            >
              Mi deuda
            </button>
          </div>
        )}

        <div style={{ width: "100%", padding: "clamp(1.1rem, 3vw, 1.75rem) clamp(1rem, 3vw, 1.5rem)", borderRadius: "clamp(18px, 4vw, 22px)", backgroundColor: "rgba(6, 15, 23, 0.42)", border: "1px solid rgba(148, 163, 184, 0.14)", boxShadow: "0 28px 80px rgba(0, 0, 0, 0.55)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.8rem" }}>
	            <div
	              style={{
	                width: "100%",
	                maxWidth: "640px",
	                height: isCompactMobile
	                  ? `clamp(86px, 24vw, ${logoHeightMobile}px)`
	                  : `clamp(96px, 19vw, ${logoHeightDesktop}px)`,
	                display: "flex",
	                alignItems: "center",
	                justifyContent: "center",
	                padding: 0,
	                background: "transparent"
	              }}
	            >
	              <img
	                src="/logo.png"
	                alt="Mis Finanzas"
	                style={{
	                  width: `${logoScale}%`,
	                  height: `${logoScale}%`,
	                  objectFit: "contain",
	                  objectPosition: "center",
	                  filter: "drop-shadow(0 14px 26px rgba(0,0,0,0.4))"
	                }}
	              />
	            </div>

            <div style={{ textAlign: "center" }}>
              <div style={{ color: "var(--color-text-secondary)", fontSize: isCompactMobile ? "clamp(0.92rem, 3.3vw, 1.02rem)" : "clamp(0.95rem, 3.5vw, 1.05rem)", fontWeight: 650 }}>
                Controla tu dinero de forma inteligente
              </div>
            </div>
          </div>

        {error && (
          <div style={{ width: "100%", padding: "0.9rem 1rem", marginTop: "1rem", backgroundColor: "var(--color-danger-bg)", color: "var(--color-on-accent)", borderRadius: "var(--radius-md)", fontSize: "0.9rem", textAlign: "center", fontWeight: 600, border: "1px solid rgba(239, 68, 68, 0.35)" }}>
            {error}
          </div>
        )}

        {(!isCompactMobile || activePane === "login") && (
          loading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "1.75rem 0" }}>
              <div className="animate-spin" style={{ width: 44, height: 44, border: "4px solid rgba(148, 163, 184, 0.22)", borderTopColor: "var(--color-primary)", borderRadius: "50%" }} />
              <div style={{ color: "var(--color-text-secondary)", fontWeight: 700 }}>Verificando acceso...</div>
            </div>
          ) : (
            <>
              <div style={{ marginTop: "1rem" }}>
                <button type="button" onClick={() => googleLogin()} style={{ width: "100%", height: "clamp(52px, 13vw, 64px)", borderRadius: "18px", border: "1px solid var(--color-border-inverse)", backgroundColor: "var(--color-surface-inverse)", color: "var(--color-text-inverse)", fontSize: "clamp(0.95rem, 3.2vw, 1rem)", fontWeight: 850, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", boxShadow: "0 18px 46px rgba(0, 0, 0, 0.42)", cursor: "pointer" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continuar con Google
                </button>
                <div style={{ marginTop: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.55rem", color: "var(--color-text-secondary)", fontWeight: 700 }}>
                  <span style={{ width: 18, height: 18, borderRadius: 9, border: "1px solid rgba(16, 185, 129, 0.55)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L4 6V12C4 16.4183 7.5817 20 12 22C16.4183 20 20 16.4183 20 12V6L12 2Z" stroke="rgba(16,185,129,0.85)" strokeWidth="2" />
                      <path d="M9 12L11 14L15.5 9.5" stroke="rgba(16,185,129,0.85)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  Seguro, rápido y sin complicaciones
                </div>
              </div>

              {/* Tarjetas informativas eliminadas por solicitud (Privado / Eficiente). */}
          </>
          )
        )}
        </div>

        {(!isCompactMobile || activePane === "debt") && (
        <div style={{ width: "100%", padding: "clamp(1.05rem, 3vw, 1.4rem) clamp(1rem, 3vw, 1.5rem)", borderRadius: "clamp(18px, 4vw, 22px)", backgroundColor: "rgba(6, 15, 23, 0.42)", border: "1px solid rgba(148, 163, 184, 0.14)", boxShadow: "0 28px 80px rgba(0, 0, 0, 0.55)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.9rem" }}>
            <div style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(16, 185, 129, 0.12)", border: "1px solid rgba(16, 185, 129, 0.25)", display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 3h10v18H7V3Z" stroke="rgba(16,185,129,0.85)" strokeWidth="2" />
                <path d="M9 7h6" stroke="rgba(16,185,129,0.85)" strokeWidth="2" strokeLinecap="round" />
                <path d="M9 11h6" stroke="rgba(16,185,129,0.85)" strokeWidth="2" strokeLinecap="round" />
                <path d="M9 15h4" stroke="rgba(16,185,129,0.85)" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "clamp(1.12rem, 4.6vw, 1.35rem)", fontWeight: 900, color: "var(--color-text)" }}>Seguimiento de mi deuda</div>
              <div style={{ marginTop: "0.25rem", color: "var(--color-text-secondary)", fontWeight: 650 }}>
                Accede al estado de tu préstamo con tu código personal
              </div>
            </div>
          </div>

          <div style={{ marginTop: isCompactMobile ? "0.85rem" : "1.1rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: isCompactMobile ? "0.65rem" : "0.85rem", alignItems: "stretch" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", padding: "0.85rem 0.9rem", borderRadius: "16px", border: "1px solid rgba(148, 163, 184, 0.16)", backgroundColor: "rgba(15, 23, 42, 0.22)", minWidth: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="rgba(226,232,240,0.75)" strokeWidth="2" strokeLinecap="round" />
                <path d="M6 11h12v10H6V11Z" stroke="rgba(226,232,240,0.75)" strokeWidth="2" strokeLinejoin="round" />
              </svg>
              <input
                value={debtCode}
                onChange={(e) => setDebtCode(e.target.value)}
                placeholder="Introduce tu código de deuda"
                inputMode="text"
                autoComplete="off"
                style={{ flex: 1, minWidth: 0, width: "100%", background: "transparent", border: "none", outline: "none", color: "var(--color-text)", fontWeight: 700, fontSize: "16px" }}
              />
            </div>

            <button
              type="button"
              onClick={onDebtSubmit}
              disabled={debtLoading}
              style={{
                width: "100%",
                height: "52px",
                padding: "0 1.15rem",
                borderRadius: "16px",
                border: "1px solid rgba(16, 185, 129, 0.20)",
                backgroundColor: "rgba(16, 185, 129, 0.85)",
                color: "var(--color-text-inverse)",
                fontWeight: 900,
                fontSize: "0.98rem",
                cursor: debtLoading ? "not-allowed" : "pointer",
                opacity: debtLoading ? 0.75 : 1,
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                justifyContent: "center",
                boxShadow: "0 18px 40px rgba(16, 185, 129, 0.18)"
              }}
            >
              {debtLoading ? "Consultando..." : "Consultar deuda"}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12h12" stroke="var(--color-text-inverse)" strokeWidth="2" strokeLinecap="round" />
                <path d="M13 6l6 6-6 6" stroke="var(--color-text-inverse)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {debtError && (
            <div style={{ marginTop: "0.9rem", width: "100%", padding: "0.85rem 0.95rem", backgroundColor: "rgba(239, 68, 68, 0.14)", color: "var(--color-on-accent)", borderRadius: "14px", fontSize: "0.92rem", textAlign: "left", fontWeight: 700, border: "1px solid rgba(239, 68, 68, 0.25)" }}>
              {debtError}
            </div>
          )}

          {debtData && (
            <div style={{ marginTop: "1.05rem", padding: "1rem 1rem", borderRadius: "18px", border: "1px solid rgba(148, 163, 184, 0.14)", backgroundColor: "rgba(15, 23, 42, 0.18)" }}>
              {(debtData.concepto || debtData.persona) && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem", marginBottom: "0.9rem" }}>
                  {debtData.concepto && (
                    <div>
                      <div style={{ color: "rgba(226, 232, 240, 0.62)", fontWeight: 750, fontSize: "0.85rem" }}>Concepto</div>
                      <div style={{ marginTop: "0.2rem", color: "rgba(226, 232, 240, 0.95)", fontWeight: 900, fontSize: "1.02rem" }}>{String(debtData.concepto)}</div>
                    </div>
                  )}
                  {debtData.persona && (
                    <div>
                      <div style={{ color: "rgba(226, 232, 240, 0.62)", fontWeight: 750, fontSize: "0.85rem" }}>{String(debtData.personaLabel || "Persona")}</div>
                      <div style={{ marginTop: "0.2rem", color: "rgba(226, 232, 240, 0.95)", fontWeight: 900, fontSize: "1.02rem" }}>{String(debtData.persona)}</div>
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.8rem" }}>
                <div style={{ color: "var(--color-text)", fontWeight: 900, fontSize: "1.05rem" }}>
                  Estado: <span style={{ color: "rgba(16, 185, 129, 0.95)" }}>{String(debtData.estado || "").toUpperCase() || "ACTIVO"}</span>
                </div>
                <div style={{ color: "var(--color-text-secondary)", fontWeight: 750 }}>
                  {debtProgress}% pagado
                </div>
              </div>

              <div style={{ marginTop: "0.75rem", height: 10, borderRadius: 999, backgroundColor: "rgba(148, 163, 184, 0.18)", overflow: "hidden" }}>
                <div style={{ width: `${debtProgress}%`, height: "100%", background: "linear-gradient(90deg, rgba(16,185,129,0.95), rgba(34,211,238,0.75))" }} />
              </div>

              <div style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.85rem" }}>
                <div>
                  <div style={{ color: "var(--color-text-secondary)", fontWeight: 750, fontSize: "0.85rem" }}>Total</div>
                  <div style={{ marginTop: "0.2rem", color: "var(--color-text)", fontWeight: 900, fontSize: "1.02rem" }}>{formatCurrency(debtData.total)}</div>
                </div>
                <div>
                  <div style={{ color: "var(--color-text-secondary)", fontWeight: 750, fontSize: "0.85rem" }}>Pagado</div>
                  <div style={{ marginTop: "0.2rem", color: "rgba(16, 185, 129, 0.95)", fontWeight: 900, fontSize: "1.02rem" }}>{formatCurrency(debtData.pagado)}</div>
                </div>
                <div>
                  <div style={{ color: "var(--color-text-secondary)", fontWeight: 750, fontSize: "0.85rem" }}>Pendiente</div>
                  <div style={{ marginTop: "0.2rem", color: "var(--color-text)", fontWeight: 900, fontSize: "1.02rem" }}>{formatCurrency(debtData.pendiente)}</div>
                </div>
              </div>

              {Array.isArray(debtData.historialPagos) && debtData.historialPagos.length > 0 && (
                <div style={{ marginTop: "1rem", paddingTop: "0.95rem", borderTop: "1px solid rgba(148, 163, 184, 0.14)" }}>
                  <div style={{ color: "rgba(226, 232, 240, 0.92)", fontWeight: 900, fontSize: "1rem", marginBottom: "0.65rem" }}>
                    {debtData.tipo === "credit" ? "Historial de cobros" : "Historial de devoluciones"}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                    {debtData.historialPagos.map((p, idx) => (
                      <div key={`${String(p?.date || "")}-${idx}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem", padding: "0.75rem 0.85rem", borderRadius: "14px", border: "1px solid rgba(148, 163, 184, 0.14)", backgroundColor: "rgba(2, 8, 14, 0.22)" }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ color: "var(--color-text)", fontWeight: 850 }}>
                            {p?.date ? new Date(p.date).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" }) : "Sin fecha"}
                          </div>
                          {p?.note ? (
                            <div style={{ marginTop: "0.25rem", color: "var(--color-text-secondary)", fontWeight: 650, fontSize: "0.88rem", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {String(p.note)}
                            </div>
                          ) : null}
                        </div>
                        <div style={{ color: "rgba(16, 185, 129, 0.95)", fontWeight: 900, whiteSpace: "nowrap" }}>
                          {formatCurrency(p?.amount || 0)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

	              <div style={{ marginTop: "0.85rem", color: "var(--color-text-secondary)", fontWeight: 700, fontSize: "0.88rem" }}>
	                Este acceso es solo para seguimiento. No necesitas iniciar sesión.
	              </div>
	            </div>
	          )}
	        </div>
	        )}
	      </div>
	    </div>
	  );
}
