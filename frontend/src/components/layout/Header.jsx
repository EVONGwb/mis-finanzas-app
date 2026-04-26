import { Menu, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useCurrency, CURRENCIES } from "../../context/CurrencyContext";

export function Header({ onMenuClick, user }) {
  const navigate = useNavigate();
  const { currency, setCurrency } = useCurrency();
  const [logoError, setLogoError] = useState(false);

  const handleCurrencyChange = (e) => {
    setCurrency(e.target.value);
  };

  return (
    <header style={{
      height: "80px",
      backgroundColor: "var(--color-glass-bg)",
      borderBottom: "none", // Remove border for cleaner look
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 1.5rem",
      position: "sticky",
      top: 0,
      zIndex: 30,
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      borderBottom: "1px solid var(--color-glass-border)",
      boxShadow: "var(--shadow-sm)"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <button
          type="button"
          onClick={onMenuClick}
          className="md-hidden"
          style={{
            background: "transparent",
            border: "1px solid var(--color-glass-border)",
            color: "var(--color-text)",
            borderRadius: "12px",
            width: 42,
            height: 42,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)"
          }}
        >
          <Menu size={22} />
        </button>

        {/* Logo and App Name */}
        {!logoError ? (
          <img 
            src="/logo.png?v=2" 
            alt="Mis Finanzas" 
            style={{ 
              height: "40px", 
              width: "auto", 
              maxWidth: "140px",
              objectFit: "contain",
              // borderRadius: "8px",
            }}
            onError={() => setLogoError(true)}
          />
        ) : (
          <div style={{ 
            width: "40px", height: "40px", 
            borderRadius: "12px", 
            background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontWeight: "bold",
            fontSize: "1.2rem",
            boxShadow: "0 4px 10px rgba(16, 185, 129, 0.3)"
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
          </div>
        )}
        <div>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 900, color: "var(--color-text)", lineHeight: 1.1, letterSpacing: "-0.5px" }}>Mis Finanzas</h1>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        {/* Currency Selector (Direct Access) */}
        <div style={{ 
          position: "relative", 
          display: "flex", 
          alignItems: "center", 
          backgroundColor: "var(--color-surface)", 
          borderRadius: "8px", 
          padding: "4px 8px",
          border: "1px solid var(--color-border)"
        }}>
          <span style={{ 
            fontSize: "0.8rem", 
            fontWeight: "bold", 
            color: "var(--color-text)", 
            marginRight: "4px" 
          }}>
            {CURRENCIES.find(c => c.code === currency)?.symbol}
          </span>
          <select 
            value={currency} 
            onChange={handleCurrencyChange}
            style={{
              appearance: "none",
              background: "transparent",
              border: "none",
              fontSize: "0.8rem",
              fontWeight: 600,
              color: "var(--color-text)",
              cursor: "pointer",
              paddingRight: "14px", // Space for chevron
              outline: "none"
            }}
          >
            {CURRENCIES.map(c => (
              <option key={c.code} value={c.code}>{c.code}</option>
            ))}
          </select>
          <ChevronDown size={12} style={{ position: "absolute", right: "6px", pointerEvents: "none", color: "var(--color-text-tertiary)" }} />
        </div>

        {/* User Avatar */}
        <div 
          onClick={() => navigate('/profile')} 
          style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "0.75rem", 
            cursor: "pointer",
            backgroundColor: "var(--color-surface)", 
            borderRadius: "50%",
            padding: "2px",
            border: "1px solid var(--color-border)",
            marginLeft: "0.5rem"
          }}
        >
          <div style={{
            width: "36px", height: "36px", borderRadius: "50%",
            backgroundColor: "var(--color-surface-strong)", display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--color-text)", fontWeight: "bold", fontSize: "0.9rem"
          }}>
             {user?.name ? user.name.substring(0, 2).toUpperCase() : "PM"}
          </div>
        </div>
      </div>
    </header>
  );
}
