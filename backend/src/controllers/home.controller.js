import { Home, HomeRequest, HomeProduct, HomeShoppingItem, HomePurchase } from "../models/home.model.js";
import { User } from "../models/user.model.js";
import { HttpError } from "../utils/httpError.js";

// === GESTIÓN DE HOGAR (VINCULACIÓN) ===

export const getHome = async (req, res, next) => {
  try {
    // Buscar hogar donde el usuario sea miembro
    let home = await Home.findOne({ members: req.user._id }).populate("members", "name email");
    
    // Si no tiene hogar, LO CREAMOS automáticamente (Modo Single)
    if (!home) {
      home = await Home.create({
        members: [req.user._id],
        name: "Mi Hogar",
        createdBy: req.user._id
      });
      // Re-populate para devolver formato consistente
      home = await Home.findById(home._id).populate("members", "name email");
    }

    // Buscar solicitudes pendientes (recibidas o enviadas)
    let pendingRequest = null;
    pendingRequest = await HomeRequest.findOne({ 
      $or: [{ fromUser: req.user._id }, { toUser: req.user._id }],
      status: "pending"
    }).populate("fromUser", "name email").populate("toUser", "name email");

    // Buscar items pendientes de la lista de compra
    const shoppingList = await HomeShoppingItem.find({ 
      home: home._id, 
      status: "pending" 
    });

    res.json({ ok: true, data: { home: { ...home.toObject(), shoppingList }, pendingRequest } });
  } catch (error) {
    next(error);
  }
};

export const sendHomeRequest = async (req, res, next) => {
  try {
    const { partnerId } = req.body;
    
    if (!partnerId) throw new HttpError(400, "ID de pareja obligatorio");
    if (partnerId === req.user._id.toString()) throw new HttpError(400, "No puedes vincularte contigo mismo");

    // Verificar si ya tiene hogar con pareja (más de 1 miembro)
    const existingHome = await Home.findOne({ members: req.user._id });
    if (existingHome && existingHome.members.length > 1) {
      throw new HttpError(400, "Ya tienes un hogar compartido activo");
    }

    // Verificar usuario destino
    const partner = await User.findById(partnerId);
    if (!partner) throw new HttpError(404, "Usuario no encontrado");

    // Verificar si ya existe solicitud
    const existingReq = await HomeRequest.findOne({
      $or: [
        { fromUser: req.user._id, toUser: partnerId, status: "pending" },
        { fromUser: partnerId, toUser: req.user._id, status: "pending" }
      ]
    });
    if (existingReq) throw new HttpError(400, "Ya existe una solicitud pendiente");

    const request = await HomeRequest.create({
      fromUser: req.user._id,
      toUser: partnerId
    });

    res.status(201).json({ ok: true, data: request });
  } catch (error) {
    next(error);
  }
};

export const respondHomeRequest = async (req, res, next) => {
  try {
    const { requestId, action } = req.body; // action: 'accept' | 'reject'
    
    const request = await HomeRequest.findById(requestId);
    if (!request) throw new HttpError(404, "Solicitud no encontrada");
    
    if (request.toUser.toString() !== req.user._id.toString()) {
      throw new HttpError(403, "No autorizado");
    }

    if (action === "reject") {
      request.status = "rejected";
      await request.save();
      return res.json({ ok: true, message: "Solicitud rechazada" });
    }

    if (action === "accept") {
      // 1. Identificar el Hogar Destino (del que invitó)
      let targetHome = await Home.findOne({ members: request.fromUser });
      
      // Si el que invitó no tiene hogar (raro por getHome, pero posible si es user nuevo), crearlo
      if (!targetHome) {
        targetHome = await Home.create({
          members: [request.fromUser],
          name: "Nuevo Hogar Compartido",
          createdBy: request.fromUser
        });
      }

      // 2. Identificar el Hogar Origen (del que acepta, si tiene uno 'single')
      const sourceHome = await Home.findOne({ members: req.user._id });

      // 3. FUSIONAR DATOS (Migrar de Source a Target)
      if (sourceHome && sourceHome._id.toString() !== targetHome._id.toString()) {
        // Mover Productos
        await HomeProduct.updateMany({ home: sourceHome._id }, { home: targetHome._id });
        // Mover Items de Lista
        await HomeShoppingItem.updateMany({ home: sourceHome._id }, { home: targetHome._id });
        // Mover Historial
        await HomePurchase.updateMany({ home: sourceHome._id }, { home: targetHome._id });

        // Eliminar el hogar antiguo
        await Home.findByIdAndDelete(sourceHome._id);
      }

      // 4. Añadir usuario al hogar destino (si no estaba ya)
      if (!targetHome.members.includes(req.user._id)) {
        targetHome.members.push(req.user._id);
        targetHome.name = "Hogar Compartido"; // Renombrar opcionalmente
        await targetHome.save();
      }
      
      request.status = "accepted";
      await request.save();
      
      return res.json({ ok: true, data: targetHome });
    }

    throw new HttpError(400, "Acción inválida");
  } catch (error) {
    next(error);
  }
};

// === INVENTARIO ===

export const getInventory = async (req, res, next) => {
  try {
    const home = await Home.findOne({ members: req.user._id });
    if (!home) throw new HttpError(404, "No tienes un hogar vinculado");

    const products = await HomeProduct.find({ home: home._id }).sort({ name: 1 });
    res.json({ ok: true, data: products });
  } catch (error) {
    next(error);
  }
};

export const addProduct = async (req, res, next) => {
  try {
    const home = await Home.findOne({ members: req.user._id });
    if (!home) throw new HttpError(404, "No tienes un hogar vinculado");

    const product = await HomeProduct.create({ ...req.body, home: home._id });
    res.status(201).json({ ok: true, data: product });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const home = await Home.findOne({ members: req.user._id });
    if (!home) throw new HttpError(404, "No tienes un hogar vinculado");

    const product = await HomeProduct.findOneAndUpdate(
      { _id: id, home: home._id },
      req.body,
      { new: true }
    );
    if (!product) throw new HttpError(404, "Producto no encontrado");
    res.json({ ok: true, data: product });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const home = await Home.findOne({ members: req.user._id });
    if (!home) throw new HttpError(404, "No tienes un hogar vinculado");

    await HomeProduct.findOneAndDelete({ _id: id, home: home._id });
    res.json({ ok: true, message: "Producto eliminado" });
  } catch (error) {
    next(error);
  }
};

// === LISTA DE COMPRAS ===

export const getShoppingList = async (req, res, next) => {
  try {
    const home = await Home.findOne({ members: req.user._id });
    if (!home) throw new HttpError(404, "No tienes un hogar vinculado");

    const list = await HomeShoppingItem.find({ home: home._id, status: "pending" })
      .populate("addedBy", "name")
      .sort({ createdAt: -1 });
    res.json({ ok: true, data: list });
  } catch (error) {
    next(error);
  }
};

export const addToShoppingList = async (req, res, next) => {
  try {
    const home = await Home.findOne({ members: req.user._id });
    if (!home) throw new HttpError(404, "No tienes un hogar vinculado");

    const { productName, quantity, unit } = req.body;
    
    // Buscar si ya existe el item pendiente
    const existingItem = await HomeShoppingItem.findOne({ 
      home: home._id, 
      status: "pending",
      productName: { $regex: new RegExp(`^${productName}$`, 'i') } 
    });

    if (existingItem) {
      existingItem.quantity += Number(quantity) || 1;
      // Actualizar unidad si es diferente y la nueva no es genérica
      if (unit && unit !== existingItem.unit) {
        existingItem.unit = unit; 
      }
      await existingItem.save();
      return res.status(200).json({ ok: true, data: existingItem, message: "Cantidad actualizada" });
    }

    const item = await HomeShoppingItem.create({
      ...req.body,
      home: home._id,
      addedBy: req.user._id,
      status: "pending"
    });
    res.status(201).json({ ok: true, data: item });
  } catch (error) {
    next(error);
  }
};

export const buyItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { pricePerUnit, quantity, updateInventory } = req.body; 
    
    const home = await Home.findOne({ members: req.user._id });
    if (!home) throw new HttpError(404, "No tienes un hogar vinculado");

    const item = await HomeShoppingItem.findOne({ _id: id, home: home._id });
    if (!item) throw new HttpError(404, "Item no encontrado");

    const finalQuantity = Number(quantity) || item.quantity;
    const finalPricePerUnit = Number(pricePerUnit) || 0;
    const totalPrice = parseFloat((finalQuantity * finalPricePerUnit).toFixed(2));

    // Marcar como comprado
    item.status = "bought";
    item.boughtBy = req.user._id;
    item.boughtAt = new Date();
    // Actualizamos la cantidad en el item si se cambió al comprar
    item.quantity = finalQuantity; 
    await item.save();

    // Registrar en historial
    await HomePurchase.create({
      home: home._id,
      productName: item.productName,
      quantity: finalQuantity,
      unit: item.unit,
      price: totalPrice,
      buyer: req.user._id
    });

    // Actualizar inventario si se solicita
    if (updateInventory) {
      // Buscar producto por nombre (aproximado)
      const product = await HomeProduct.findOne({ 
        home: home._id, 
        name: { $regex: new RegExp(`^${item.productName}$`, 'i') } 
      });

      if (product) {
        product.stock += finalQuantity;
        await product.save();
      }
    }

    res.json({ ok: true, data: item });
  } catch (error) {
    next(error);
  }
};

export const deleteShoppingItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const home = await Home.findOne({ members: req.user._id });
    
    await HomeShoppingItem.findOneAndDelete({ _id: id, home: home._id });
    res.json({ ok: true, message: "Item eliminado" });
  } catch (error) {
    next(error);
  }
};

// === HISTORIAL ===

export const getHistory = async (req, res, next) => {
  try {
    const home = await Home.findOne({ members: req.user._id });
    if (!home) throw new HttpError(404, "No tienes un hogar vinculado");

    const history = await HomePurchase.find({ home: home._id })
      .populate("buyer", "name")
      .sort({ date: -1 })
      .limit(50); // Últimos 50
      
    res.json({ ok: true, data: history });
  } catch (error) {
    next(error);
  }
};
