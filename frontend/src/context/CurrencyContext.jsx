import { createContext, useContext, useState, useEffect } from "react";
import { getToken } from "../lib/auth";
import { useAuth } from "./AuthContext";

const CurrencyContext = createContext();

export const CURRENCIES = [
  { code: "EUR", symbol: "€", label: "Euro" },
  { code: "USD", symbol: "$", label: "Dólar Americano" },
  { code: "GBP", symbol: "£", label: "Libra Esterlina" },
  { code: "MXN", symbol: "$", label: "Peso Mexicano" },
  { code: "COP", symbol: "$", label: "Peso Colombiano" },
  { code: "ARS", symbol: "$", label: "Peso Argentino" },
  { code: "CLP", symbol: "$", label: "Peso Chileno" },
  { code: "PEN", symbol: "S/", label: "Sol Peruano" },
  { code: "BRL", symbol: "R$", label: "Real Brasileño" },
  { code: "XAF", symbol: "FCFA", label: "Franco CFA" },
  { code: "JPY", symbol: "¥", label: "Yen Japonés" },
  { code: "CNY", symbol: "¥", label: "Yuan Chino" },
];

export function CurrencyProvider({ children }) {
  const { user } = useAuth();
  const [currency, setCurrency] = useState("EUR"); // Default fallback
  const [loading, setLoading] = useState(true);

  // Sync with user profile from API (AuthContext)
  useEffect(() => {
    if (user && user.currency) {
      setCurrency(user.currency);
      setLoading(false);
    }
  }, [user]);

  // Initial Load from LocalStorage or Browser Locale (if user not yet loaded)
  useEffect(() => {
    const initCurrency = async () => {
      try {
        // 0. If user is already loaded from AuthContext, skip (handled by above useEffect)
        if (user && user.currency) return;

        // 1. Try to get from logged user in localStorage
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const u = JSON.parse(storedUser);
          if (u.currency) {
            setCurrency(u.currency);
            setLoading(false);
            return;
          }
        }

        // 2. Try browser locale detection if no user preference
        const browserLocale = navigator.language;
        // Simple mapping for common locales
        if (browserLocale.startsWith("en-US")) setCurrency("USD");
        else if (browserLocale.startsWith("es-MX")) setCurrency("MXN");
        else if (browserLocale.startsWith("es-CO")) setCurrency("COP");
        else if (browserLocale.startsWith("es-AR")) setCurrency("ARS");
        else if (browserLocale.startsWith("es-CL")) setCurrency("CLP");
        else if (browserLocale.startsWith("es-PE")) setCurrency("PEN");
        else if (browserLocale.startsWith("pt-BR")) setCurrency("BRL");
        else if (browserLocale.startsWith("en-GB")) setCurrency("GBP");
        else if (browserLocale.startsWith("ja")) setCurrency("JPY");
        else if (browserLocale.startsWith("zh")) setCurrency("CNY");
        // Default stays EUR
        
      } catch (e) {
        console.error("Error detecting currency:", e);
      } finally {
        setLoading(false);
      }
    };
    initCurrency();
  }, [user]); // Re-run if user changes (e.g. login/logout)

  const updateCurrency = (newCurrency) => {
    // Validate currency
    const isValid = CURRENCIES.some(c => c.code === newCurrency);
    if (!isValid) return;

    setCurrency(newCurrency);
    // Also update local storage user if present to keep in sync immediately
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      user.currency = newCurrency;
      localStorage.setItem("user", JSON.stringify(user));
    }
  };

  const safeCurrency = CURRENCIES.some(c => c.code === currency) ? currency : "EUR";

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return "-";
    
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: safeCurrency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    } catch (e) {
      console.error("Format currency error:", e);
      return `${amount}`;
    }
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency: updateCurrency, formatCurrency, loading }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => useContext(CurrencyContext);
