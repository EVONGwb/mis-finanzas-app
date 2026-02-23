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
  AlertCircle
} from "lucide-react";

export default function Home() {
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

  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [selectedItemToBuy, setSelectedItemToBuy] = useState(null);
  const [buyPrice, setBuyPrice] = useState("");
  const [isBuying, setIsBuying] = useState(false);

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

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      await apiFetch("/home/inventory", {
        method: "POST",
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

  const openBuyModal = (item) => {
    setSelectedItemToBuy(item);
    setBuyPrice("");
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
          price: parseFloat(buyPrice) || 0, 
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
    if (!confirm("¿Borrar?")) return;
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

  // 1. SIN HOGAR: PANTALLA DE VINCULACIÓN
  if (!homeData?.home) {
    return (
      <div className="animate-fade-in" style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
        <div style={{ backgroundColor: "var(--color-surface)", padding: "3rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)" }}>
          <div style={{ 
            width: "80px", height: "80px", backgroundColor: "var(--color-primary-bg)", 
            borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 1.5rem auto", color: "var(--color-primary)"
          }}>
            <HomeIcon size={40} />
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "bold", marginBottom: "1rem" }}>Hogar Compartido</h1>
          <p style={{ color: "var(--color-text-secondary)", marginBottom: "2rem", lineHeight: "1.6" }}>
            Vincula tu cuenta con tu pareja para gestionar juntos la lista de la compra, 
            el inventario de casa y los gastos comunes.
          </p>

          {homeData?.pendingRequest ? (
            <div style={{ backgroundColor: "var(--color-warning-bg)", padding: "1.5rem", borderRadius: "var(--radius-md)", marginBottom: "1.5rem" }}>
              <h3 style={{ fontWeight: "bold", color: "var(--color-warning-text)", marginBottom: "0.5rem" }}>Solicitud Pendiente</h3>
              {homeData.pendingRequest.toUser._id === JSON.parse(localStorage.getItem("user"))._id ? (
                <div>
                  <p style={{ marginBottom: "1rem" }}>
                    <strong>{homeData.pendingRequest.fromUser.name}</strong> quiere compartir hogar contigo.
                  </p>
                  <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
                    <Button onClick={() => handleRespondRequest(homeData.pendingRequest._id, "accept")}>Aceptar</Button>
                    <Button variant="ghost" onClick={() => handleRespondRequest(homeData.pendingRequest._id, "reject")}>Rechazar</Button>
                  </div>
                </div>
              ) : (
                <p>Esperando respuesta de <strong>{homeData.pendingRequest.toUser.name}</strong>...</p>
              )}
            </div>
          ) : (
            <Button onClick={() => setIsLinkModalOpen(true)}>
              <UserPlus size={18} style={{ marginRight: "0.5rem" }} /> Vincular con Pareja
            </Button>
          )}
        </div>

        <Modal isOpen={isLinkModalOpen} onClose={() => setIsLinkModalOpen(false)} title="Vincular Pareja">
          <form onSubmit={handleSendRequest} style={{ display: "grid", gap: "1rem" }}>
            <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
              Pide a tu pareja su ID de usuario (lo puede ver en su Perfil).
            </p>
            <Input 
              label="ID de Usuario de tu Pareja" 
              required 
              value={linkForm.partnerId}
              onChange={(e) => setLinkForm({ partnerId: e.target.value })}
            />
            <Button type="submit">Enviar Solicitud</Button>
          </form>
        </Modal>
      </div>
    );
  }

  // 2. CON HOGAR: DASHBOARD
  return (
    <div className="animate-fade-in" style={{ paddingBottom: "5rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.875rem", fontWeight: "bold", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <HomeIcon className="text-primary" /> {homeData.home.name}
        </h1>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>
          Miembros: {homeData.home.members.map(m => m.name).join(", ")}
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
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
                  <div>
                    <span style={{ fontWeight: 600, fontSize: "1.1rem" }}>{item.productName}</span>
                    <div style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
                      {item.quantity} {item.unit} • Por: {item.addedBy?.name}
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
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span style={{ fontWeight: 600 }}>{prod.name}</span>
                    <Badge variant={isLow ? "danger" : "success"}>
                      {prod.stock} {prod.unit}
                    </Badge>
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
                          alert("Añadido a lista de compra");
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
          <Table headers={["Producto", "Cant.", "Precio", "Comprador", "Fecha"]}>
            {history.map(h => (
              <TableRow key={h._id}>
                <TableCell>{h.productName}</TableCell>
                <TableCell>{h.quantity} {h.unit}</TableCell>
                <TableCell>${h.price}</TableCell>
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
          <Input label="Producto" required value={itemForm.productName} onChange={e => setItemForm({...itemForm, productName: e.target.value})} />
          <div style={{ display: "flex", gap: "1rem" }}>
            <Input label="Cantidad" type="number" required value={itemForm.quantity} onChange={e => setItemForm({...itemForm, quantity: e.target.value})} />
            <Input label="Unidad" required value={itemForm.unit} onChange={e => setItemForm({...itemForm, unit: e.target.value})} />
          </div>
          <Button type="submit">Añadir</Button>
        </form>
      </Modal>

      <Modal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} title="Nuevo Producto">
        <form onSubmit={handleAddProduct} style={{ display: "grid", gap: "1rem" }}>
          <Input label="Nombre" required value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} />
          <div style={{ display: "flex", gap: "1rem" }}>
            <Input label="Stock Actual" type="number" required value={productForm.stock} onChange={e => setProductForm({...productForm, stock: e.target.value})} />
            <Input label="Unidad" required value={productForm.unit} onChange={e => setProductForm({...productForm, unit: e.target.value})} />
          </div>
          <div style={{ display: "flex", gap: "1rem" }}>
            <Input label="Stock Mínimo (Alerta)" type="number" required value={productForm.minStock} onChange={e => setProductForm({...productForm, minStock: e.target.value})} />
            <Input label="Stock Objetivo" type="number" required value={productForm.targetStock} onChange={e => setProductForm({...productForm, targetStock: e.target.value})} />
          </div>
          <Button type="submit">Guardar Producto</Button>
        </form>
      </Modal>

      <Modal isOpen={isBuyModalOpen} onClose={() => setIsBuyModalOpen(false)} title="Confirmar Compra">
        <form onSubmit={handleConfirmBuy} style={{ display: "grid", gap: "1rem" }}>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>
            Estás marcando como comprado: <strong>{selectedItemToBuy?.productName}</strong> ({selectedItemToBuy?.quantity} {selectedItemToBuy?.unit})
          </p>
          <Input 
            label="Precio Total (Opcional)" 
            type="number" 
            step="0.01" 
            placeholder="0.00"
            value={buyPrice} 
            onChange={e => setBuyPrice(e.target.value)} 
          />
          <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
            <Button type="button" variant="ghost" onClick={() => setIsBuyModalOpen(false)} style={{ flex: 1 }}>Cancelar</Button>
            <Button type="submit" style={{ flex: 1 }} isLoading={isBuying}>Confirmar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
