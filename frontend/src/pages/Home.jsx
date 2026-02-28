import { useState, useEffect } from "react";
import { apiFetch } from "../lib/api";
import { getToken } from "../lib/auth";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Input } from "../components/ui/Input";
import { Table, TableRow, TableCell } from "../components/ui/Table";
import { Badge } from "../components/ui/Badge";
import { Skeleton } from "../components/ui/Skeleton";
import { useCurrency } from "../context/CurrencyContext";
import { 
  Home as HomeIcon, 
  ShoppingCart, 
  Package, 
  History, 
  Plus, 
  Check, 
  Trash2, 
  Edit2, 
  UserPlus,
  UserMinus,
  AlertCircle
} from "lucide-react";

const FOOD_IMAGES = {
  // Frutas y Verduras
  "manzana": "https://cdn-icons-png.flaticon.com/512/415/415733.png",
  "platano": "https://cdn-icons-png.flaticon.com/512/2909/2909787.png",
  "naranja": "https://cdn-icons-png.flaticon.com/512/135/135620.png",
  "limon": "https://cdn-icons-png.flaticon.com/512/6033/6033703.png",
  "tomate": "https://cdn-icons-png.flaticon.com/512/1202/1202125.png",
  "lechuga": "https://cdn-icons-png.flaticon.com/512/765/765618.png",
  "patata": "https://cdn-icons-png.flaticon.com/512/765/765584.png",
  "cebolla": "https://cdn-icons-png.flaticon.com/512/765/765551.png",
  "zanahoria": "https://cdn-icons-png.flaticon.com/512/2909/2909841.png",
  "ajo": "https://cdn-icons-png.flaticon.com/512/5029/5029236.png",
  
  // Lácteos y Huevos
  "leche": "https://cdn-icons-png.flaticon.com/512/970/970929.png",
  "huevo": "https://cdn-icons-png.flaticon.com/512/837/837560.png",
  "queso": "https://cdn-icons-png.flaticon.com/512/305/305978.png",
  "yogur": "https://cdn-icons-png.flaticon.com/512/2935/2935394.png",
  "mantequilla": "https://cdn-icons-png.flaticon.com/512/2674/2674062.png",

  // Panadería y Cereales
  "pan": "https://cdn-icons-png.flaticon.com/512/3014/3014520.png",
  "arroz": "https://cdn-icons-png.flaticon.com/512/3014/3014527.png",
  "pasta": "https://cdn-icons-png.flaticon.com/512/2515/2515139.png",
  "harina": "https://cdn-icons-png.flaticon.com/512/3348/3348079.png",
  "cereal": "https://cdn-icons-png.flaticon.com/512/2674/2674066.png",

  // Carnes y Pescados
  "pollo": "https://cdn-icons-png.flaticon.com/512/1046/1046774.png",
  "carne": "https://cdn-icons-png.flaticon.com/512/3143/3143643.png",
  "pescado": "https://cdn-icons-png.flaticon.com/512/2515/2515183.png",
  "jamon": "https://cdn-icons-png.flaticon.com/512/2312/2312297.png",
  "salchicha": "https://cdn-icons-png.flaticon.com/512/3082/3082008.png",

  // Bebidas
  "agua": "https://cdn-icons-png.flaticon.com/512/3105/3105807.png",
  "cafe": "https://cdn-icons-png.flaticon.com/512/3054/3054889.png",
  "te": "https://cdn-icons-png.flaticon.com/512/3054/3054898.png",
  "jugo": "https://cdn-icons-png.flaticon.com/512/2405/2405597.png",
  "cerveza": "https://cdn-icons-png.flaticon.com/512/931/931949.png",
  "vino": "https://cdn-icons-png.flaticon.com/512/2405/2405451.png",

  // Otros
  "aceite": "https://cdn-icons-png.flaticon.com/512/1202/1202058.png",
  "sal": "https://cdn-icons-png.flaticon.com/512/3348/3348092.png",
  "azucar": "https://cdn-icons-png.flaticon.com/512/2674/2674116.png",
  "salsa": "https://cdn-icons-png.flaticon.com/512/859/859344.png",
  "chocolate": "https://cdn-icons-png.flaticon.com/512/2553/2553691.png"
};

const getFoodImage = (name) => {
  const lowerName = name.toLowerCase();
  // Búsqueda exacta
  if (FOOD_IMAGES[lowerName]) return FOOD_IMAGES[lowerName];
  
  // Búsqueda parcial
  for (const [key, url] of Object.entries(FOOD_IMAGES)) {
    if (lowerName.includes(key)) return url;
  }
  
  // Default fallback icon based on first letter or generic
  return "https://cdn-icons-png.flaticon.com/512/2927/2927347.png"; // Caja genérica
};

export default function Home() {
  const { formatCurrency } = useCurrency();
  const [activeTab, setActiveTab] = useState("list"); // 'list', 'inventory', 'history', 'settings'
  const [homeData, setHomeData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [shoppingList, setShoppingList] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [history, setHistory] = useState([]);

  // Modal States
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [newName, setNewName] = useState("");

  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [selectedItemToBuy, setSelectedItemToBuy] = useState(null);
  const [buyForm, setBuyForm] = useState({ quantity: "", pricePerUnit: "" });
  const [isBuying, setIsBuying] = useState(false);

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Forms
  const [productForm, setProductForm] = useState({
    name: "", category: "General", unit: "ud", stock: 0, targetStock: 1, minStock: 1, note: ""
  });
  const [itemForm, setItemForm] = useState({
    productName: "", quantity: 1, unit: "ud"
  });
  const [linkForm, setLinkForm] = useState({ partnerId: "" });

  useEffect(() => {
    fetchHomeData();
  }, []);

  useEffect(() => {
    if (homeData?.home) {
      if (activeTab === "list") fetchShoppingList();
      if (activeTab === "inventory") fetchInventory();
      if (activeTab === "history") fetchHistory();
    }
  }, [activeTab, homeData]);

  const fetchHomeData = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/home/request", { method: "GET", token: getToken() }).catch(() => null); 
      // El endpoint es /home pero el controller usa getHome. 
      // Ups, en routes puse /home apuntando a getHome.
      const resHome = await apiFetch("/home", { token: getToken() });
      setHomeData(resHome.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    const res = await apiFetch("/home/inventory", { token: getToken() });
    setInventory(res.data);
  };

  const fetchShoppingList = async () => {
    const res = await apiFetch("/home/shopping-list", { token: getToken() });
    setShoppingList(res.data);
  };

  const fetchHistory = async () => {
    const res = await apiFetch("/home/history", { token: getToken() });
    setHistory(res.data);
  };

  // --- HANDLERS ---

  const handleSendRequest = async (e) => {
    e.preventDefault();
    try {
      await apiFetch("/home/request", {
        method: "POST",
        token: getToken(),
        body: linkForm
      });
      alert("Solicitud enviada");
      setIsLinkModalOpen(false);
      fetchHomeData();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleRespondRequest = async (requestId, action) => {
    try {
      await apiFetch("/home/respond", {
        method: "POST",
        token: getToken(),
        body: { requestId, action }
      });
      fetchHomeData();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleLeaveHome = async () => {
    if (!confirm("¿Seguro que quieres desvincularte? Se creará un nuevo hogar vacío para ti.")) return;
    try {
      await apiFetch("/home/leave", { method: "POST", token: getToken() });
      fetchHomeData();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleUpdateName = async (e) => {
    e.preventDefault();
    try {
      await apiFetch("/home/name", {
        method: "PATCH",
        token: getToken(),
        body: { name: newName }
      });
      setIsNameModalOpen(false);
      fetchHomeData();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleEditStock = async (prod, newStock) => {
    try {
      await apiFetch(`/home/inventory/${prod._id}`, {
        method: "PATCH",
        token: getToken(),
        body: { stock: parseFloat(newStock) || 0 }
      });
      fetchInventory();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleEditProduct = (prod) => {
    setProductForm({
      id: prod._id,
      name: prod.name,
      category: prod.category,
      unit: prod.unit,
      stock: prod.stock,
      targetStock: prod.targetStock,
      minStock: prod.minStock,
      note: prod.note || ""
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      const isEdit = !!productForm.id;
      const url = isEdit ? `/home/inventory/${productForm.id}` : "/home/inventory";
      const method = isEdit ? "PATCH" : "POST";

      await apiFetch(url, {
        method,
        token: getToken(),
        body: productForm
      });
      
      setIsProductModalOpen(false);
      setProductForm({ name: "", category: "General", unit: "ud", stock: 0, targetStock: 1, minStock: 1, note: "" });
      fetchInventory();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      await apiFetch("/home/shopping-list", {
        method: "POST",
        token: getToken(),
        body: itemForm
      });
      setIsItemModalOpen(false);
      setItemForm({ productName: "", quantity: 1, unit: "ud" });
      fetchShoppingList();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleProductInputChange = (value) => {
    setItemForm({...itemForm, productName: value});
    if (value.length > 0) {
      const lowerVal = value.toLowerCase();
      const matched = Object.keys(FOOD_IMAGES).filter(k => k.includes(lowerVal));
      setSuggestions(matched.slice(0, 5));
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (name) => {
    setItemForm({...itemForm, productName: name.charAt(0).toUpperCase() + name.slice(1)});
    setShowSuggestions(false);
  };

  const openBuyModal = (item) => {
    setSelectedItemToBuy(item);
    setBuyForm({ quantity: item.quantity, pricePerUnit: "" });
    setIsBuyModalOpen(true);
  };

  const handleConfirmBuy = async (e) => {
    e.preventDefault();
    if (!selectedItemToBuy) return;
    
    setIsBuying(true);
    try {
      await apiFetch(`/home/shopping-list/${selectedItemToBuy._id}/buy`, {
        method: "POST",
        token: getToken(),
        body: { 
          quantity: parseFloat(buyForm.quantity) || selectedItemToBuy.quantity,
          pricePerUnit: parseFloat(buyForm.pricePerUnit) || 0,
          updateInventory: true 
        }
      });
      setIsBuyModalOpen(false);
      setSelectedItemToBuy(null);
      fetchShoppingList();
    } catch (error) {
      alert(error.message);
    } finally {
      setIsBuying(false);
    }
  };

  const handleDeleteItem = async (id) => {
    // if (!confirm("¿Borrar?")) return;
    try {
      await apiFetch(`/home/shopping-list/${id}`, { method: "DELETE", token: getToken() });
      fetchShoppingList();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm("¿Borrar producto del inventario?")) return;
    try {
      await apiFetch(`/home/inventory/${id}`, { method: "DELETE", token: getToken() });
      fetchInventory();
    } catch (error) {
      alert(error.message);
    }
  };

  // --- RENDER ---

  if (loading) return <div className="p-4"><Skeleton height="300px" /></div>;

  // 1. SIN HOGAR: PANTALLA DE VINCULACIÓN (Eliminada - Ahora siempre hay hogar)
  if (!homeData?.home) return null;

  // 2. CON HOGAR: DASHBOARD
  return (
    <div className="animate-fade-in" style={{ paddingBottom: "5rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        {/* Cabecera con Nombre y Botones */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ 
              fontWeight: "bold", 
              display: "flex", 
              alignItems: "center", 
              gap: "0.5rem",
              fontSize: homeData.home.name.length > 15 ? "1.25rem" : "1.875rem",
              whiteSpace: "nowrap"
            }}>
              <HomeIcon className="text-primary" /> 
              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{homeData.home.name}</span>
              <Button size="icon" variant="ghost" onClick={() => { setNewName(homeData.home.name); setIsNameModalOpen(true); }} title="Editar nombre">
                <Edit2 size={16} />
              </Button>
            </h1>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>
              Miembros ({homeData.home.members.length}/4): {homeData.home.members.map(m => m.name).join(", ")}
            </p>
          </div>
          
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {/* Botón de vincular si no está lleno */}
            {homeData.home.members.length < 4 && !homeData.pendingRequest && (
              <Button size="sm" variant="outline" onClick={() => setIsLinkModalOpen(true)}>
                <UserPlus size={16} style={{ marginRight: "0.5rem" }} /> Invitar Miembro
              </Button>
            )}

            {homeData.home.members.length > 1 && (
              <Button size="sm" variant="outline" style={{ borderColor: "var(--color-danger)", color: "var(--color-danger)" }} onClick={handleLeaveHome}>
                <UserMinus size={16} style={{ marginRight: "0.5rem" }} /> Desvincular
              </Button>
            )}
          </div>
        </div>

        {/* Notificación de solicitud pendiente */}
        {homeData.pendingRequest && (
          <div style={{ backgroundColor: "var(--color-warning-bg)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-warning-border)" }}>
            <h3 style={{ fontWeight: "bold", color: "var(--color-warning-text)", marginBottom: "0.5rem", fontSize: "0.875rem" }}>Solicitud de Vinculación</h3>
            {homeData.pendingRequest.toUser._id === JSON.parse(localStorage.getItem("user"))._id ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <p style={{ fontSize: "0.875rem" }}>
                  <strong>{homeData.pendingRequest.fromUser.name}</strong> quiere compartir hogar contigo. Al aceptar, tus datos se fusionarán con los suyos.
                </p>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <Button size="sm" onClick={() => handleRespondRequest(homeData.pendingRequest._id, "accept")}>Aceptar y Fusionar</Button>
                  <Button size="sm" variant="ghost" onClick={() => handleRespondRequest(homeData.pendingRequest._id, "reject")}>Rechazar</Button>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: "0.875rem" }}>Esperando respuesta de <strong>{homeData.pendingRequest.toUser.name}</strong>...</p>
            )}
          </div>
        )}

        {/* Tabs - Debajo de todo lo anterior */}
        <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.5rem", marginTop: "0.5rem" }}>
          <Button 
            variant={activeTab === "list" ? "primary" : "ghost"} 
            onClick={() => setActiveTab("list")}
            size="sm"
          >
            <ShoppingCart size={16} style={{ marginRight: "0.5rem" }} /> Lista Compra
          </Button>
          <Button 
            variant={activeTab === "inventory" ? "primary" : "ghost"} 
            onClick={() => setActiveTab("inventory")}
            size="sm"
          >
            <Package size={16} style={{ marginRight: "0.5rem" }} /> Inventario
          </Button>
          <Button 
            variant={activeTab === "history" ? "primary" : "ghost"} 
            onClick={() => setActiveTab("history")}
            size="sm"
          >
            <History size={16} style={{ marginRight: "0.5rem" }} /> Historial
          </Button>
        </div>
      </div>

      {/* VISTAS */}
      {activeTab === "list" && (
        <div className="animate-fade-in">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ fontWeight: "bold" }}>Pendiente ({shoppingList.length})</h3>
            <Button size="sm" onClick={() => setIsItemModalOpen(true)}><Plus size={16} /> Añadir</Button>
          </div>
          
          <div style={{ display: "grid", gap: "1rem" }}>
            {shoppingList.map(item => (
              <Card key={item._id} padding="1rem">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ width: "40px", height: "40px", flexShrink: 0 }}>
                      <img src={getFoodImage(item.productName)} alt={item.productName} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    </div>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: "1.1rem" }}>{item.productName}</span>
                      <div style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
                        {item.quantity} {item.unit} • Por: {item.addedBy?.name}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <Button size="sm" variant="outline" style={{ color: "var(--color-success)", borderColor: "var(--color-success)" }} onClick={() => openBuyModal(item)}>
                      <Check size={16} />
                    </Button>
                    <Button size="sm" variant="ghost" style={{ color: "var(--color-danger)" }} onClick={() => handleDeleteItem(item._id)}>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
            {shoppingList.length === 0 && <p style={{ textAlign: "center", color: "var(--color-text-secondary)" }}>Lista vacía</p>}
          </div>
        </div>
      )}

      {activeTab === "inventory" && (
        <div className="animate-fade-in">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ fontWeight: "bold" }}>Stock ({inventory.length})</h3>
            <Button size="sm" onClick={() => setIsProductModalOpen(true)}><Plus size={16} /> Nuevo Producto</Button>
          </div>

          <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
            {inventory.map(prod => {
              const isLow = prod.stock <= prod.minStock;
              return (
                <Card key={prod._id} padding="1rem">
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div style={{ width: "32px", height: "32px", flexShrink: 0 }}>
                        <img src={getFoodImage(prod.name)} alt={prod.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                      </div>
                      <span style={{ fontWeight: 600, cursor: "pointer" }} onClick={() => handleEditProduct(prod)}>{prod.name}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <input 
                        type="number" 
                        defaultValue={prod.stock}
                        style={{ 
                          width: "50px", padding: "2px 4px", fontSize: "0.875rem", 
                          border: "1px solid var(--color-border)", borderRadius: "4px",
                          textAlign: "center"
                        }}
                        onBlur={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val) && val !== prod.stock) handleEditStock(prod, val);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.target.blur();
                        }}
                      />
                      <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>{prod.unit}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginBottom: "1rem" }}>
                    Objetivo: {prod.targetStock} • Mínimo: {prod.minStock}
                  </div>
                  {isLow && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-danger)", fontSize: "0.75rem", marginBottom: "0.5rem" }}>
                      <AlertCircle size={14} /> Falta reponer ({prod.targetStock - prod.stock} ud)
                    </div>
                  )}
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      style={{ flex: 1 }}
                      onClick={async () => {
                        // Añadir a lista de compra automáticamente
                        try {
                          await apiFetch("/home/shopping-list", {
                            method: "POST", token: getToken(),
                            body: { productName: prod.name, quantity: prod.targetStock - prod.stock, unit: prod.unit }
                          });
                          // alert("Añadido a lista de compra");
                          setActiveTab("list");
                        } catch (e) { alert(e.message); }
                      }}
                    >
                      Pedir
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDeleteProduct(prod._id)}><Trash2 size={16} /></Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <div className="animate-fade-in">
          <Table headers={["", "Producto", "Cant.", "Precio", "Comprador", "Fecha"]}>
            {history.map(h => (
              <TableRow key={h._id}>
                <TableCell>
                  <div style={{ width: "24px", height: "24px" }}>
                    <img src={getFoodImage(h.productName)} alt={h.productName} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  </div>
                </TableCell>
                <TableCell>{h.productName}</TableCell>
                <TableCell>{h.quantity} {h.unit}</TableCell>
                <TableCell>{formatCurrency(h.price)}</TableCell>
                <TableCell>{h.buyer?.name}</TableCell>
                <TableCell>{new Date(h.date).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </Table>
        </div>
      )}

      {/* Modals */}
      <Modal isOpen={isItemModalOpen} onClose={() => setIsItemModalOpen(false)} title="Añadir a la Lista">
        <form onSubmit={handleAddItem} style={{ display: "grid", gap: "1rem" }}>
          <div style={{ position: "relative" }}>
            <label style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--color-text-secondary)", marginLeft: "0.25rem", marginBottom: "0.25rem", display: "block" }}>Producto</label>
            <input 
              required 
              value={itemForm.productName} 
              onChange={e => handleProductInputChange(e.target.value)} 
              onFocus={() => itemForm.productName && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
                fontSize: "1rem",
                outline: "none",
                backgroundColor: "var(--color-surface)",
                height: "50px"
              }}
            />
            {showSuggestions && suggestions.length > 0 && (
              <div style={{ 
                position: "absolute", 
                top: "100%", 
                left: 0, 
                right: 0, 
                backgroundColor: "var(--color-surface)", 
                border: "1px solid var(--color-border)", 
                borderRadius: "0 0 8px 8px", 
                zIndex: 10,
                maxHeight: "200px",
                overflowY: "auto",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
              }}>
                {suggestions.map(s => (
                  <div 
                    key={s} 
                    onClick={() => selectSuggestion(s)}
                    style={{ 
                      padding: "0.75rem 1rem", 
                      cursor: "pointer", 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "0.75rem",
                      borderBottom: "1px solid var(--color-border)",
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = "var(--color-surface-hover)"}
                    onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                  >
                    <img src={FOOD_IMAGES[s]} alt={s} style={{ width: "24px", height: "24px", objectFit: "contain" }} />
                    <span style={{ textTransform: "capitalize" }}>{s}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: "1rem" }}>
            <Input label="Cantidad" type="number" required value={itemForm.quantity} onChange={e => setItemForm({...itemForm, quantity: e.target.value})} />
            <Input label="Unidad" required value={itemForm.unit} onChange={e => setItemForm({...itemForm, unit: e.target.value})} />
          </div>
          <Button type="submit">Añadir</Button>
        </form>
      </Modal>

      <Modal isOpen={isProductModalOpen} onClose={() => { setIsProductModalOpen(false); setProductForm({ name: "", category: "General", unit: "ud", stock: 0, targetStock: 1, minStock: 1, note: "" }); }} title={productForm.id ? "Editar Producto" : "Nuevo Producto"}>
        <form onSubmit={handleSaveProduct} style={{ display: "grid", gap: "1rem" }}>
          <Input label="Nombre" required value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} />
          <div style={{ display: "flex", gap: "1rem" }}>
            <Input label="Stock Actual" type="number" required value={productForm.stock} onChange={e => setProductForm({...productForm, stock: e.target.value})} />
            <Input label="Unidad" required value={productForm.unit} onChange={e => setProductForm({...productForm, unit: e.target.value})} />
          </div>
          <div style={{ display: "flex", gap: "1rem" }}>
            <Input label="Stock Mínimo (Alerta)" type="number" required value={productForm.minStock} onChange={e => setProductForm({...productForm, minStock: e.target.value})} />
            <Input label="Stock Objetivo" type="number" required value={productForm.targetStock} onChange={e => setProductForm({...productForm, targetStock: e.target.value})} />
          </div>
          <Input label="Nota (Opcional)" value={productForm.note} onChange={e => setProductForm({...productForm, note: e.target.value})} />
          <Button type="submit">Guardar Producto</Button>
        </form>
      </Modal>

      <Modal isOpen={isBuyModalOpen} onClose={() => setIsBuyModalOpen(false)} title="Confirmar Compra">
        <form onSubmit={handleConfirmBuy} style={{ display: "grid", gap: "1rem" }}>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>
            Producto: <strong>{selectedItemToBuy?.productName}</strong>
          </p>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <Input 
              label={`Cantidad (${selectedItemToBuy?.unit || "ud"})`}
              type="number" 
              step="0.01" 
              required
              value={buyForm.quantity} 
              onChange={e => setBuyForm({...buyForm, quantity: e.target.value})} 
            />
            <Input 
              label="Precio por Unidad ($)" 
              type="number" 
              step="0.01" 
              placeholder="0.00"
              value={buyForm.pricePerUnit} 
              onChange={e => setBuyForm({...buyForm, pricePerUnit: e.target.value})} 
            />
          </div>

          <div style={{ padding: "0.75rem", backgroundColor: "var(--color-surface-hover)", borderRadius: "var(--radius-sm)", textAlign: "right" }}>
            <span style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>Total Estimado: </span>
            <span style={{ fontWeight: "bold", fontSize: "1.1rem" }}>
              {formatCurrency((parseFloat(buyForm.quantity) || 0) * (parseFloat(buyForm.pricePerUnit) || 0))}
            </span>
          </div>

          <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
            <Button type="button" variant="ghost" onClick={() => setIsBuyModalOpen(false)} style={{ flex: 1 }}>Cancelar</Button>
            <Button type="submit" style={{ flex: 1 }} isLoading={isBuying}>Confirmar</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isLinkModalOpen} onClose={() => setIsLinkModalOpen(false)} title="Invitar Nuevo Miembro">
        <form onSubmit={handleSendRequest} style={{ display: "grid", gap: "1rem" }}>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
            Pide a tu familiar su ID de usuario (lo puede ver en su Perfil). Al enviar la solicitud, se unirá a este hogar y compartirá todo el inventario y listas.
          </p>
          <Input 
            label="ID de Usuario a Invitar" 
            required 
            value={linkForm.partnerId}
            onChange={(e) => setLinkForm({ partnerId: e.target.value })}
          />
          <Button type="submit">Enviar Solicitud</Button>
        </form>
      </Modal>

      <Modal isOpen={isNameModalOpen} onClose={() => setIsNameModalOpen(false)} title="Renombrar Hogar">
        <form onSubmit={handleUpdateName} style={{ display: "grid", gap: "1rem" }}>
          <Input 
            label="Nombre del Hogar" 
            required 
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Button type="submit">Guardar</Button>
        </form>
      </Modal>
    </div>
  );
}
