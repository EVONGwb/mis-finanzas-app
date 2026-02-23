import mongoose from "mongoose";

const homeSchema = new mongoose.Schema({
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  name: {
    type: String,
    default: "Nuestro Hogar"
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, { timestamps: true, versionKey: false });

export const Home = mongoose.model("Home", homeSchema);

const homeRequestSchema = new mongoose.Schema({
  fromUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  toUser: { // Usaremos ID como pidió el usuario, aunque email sería más fácil
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending"
  }
}, { timestamps: true, versionKey: false });

export const HomeRequest = mongoose.model("HomeRequest", homeRequestSchema);

const homeProductSchema = new mongoose.Schema({
  home: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Home",
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    default: "General"
  },
  unit: {
    type: String,
    default: "ud"
  },
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  targetStock: { // Objetivo
    type: Number,
    default: 1,
    min: 1
  },
  minStock: { // Alerta
    type: Number,
    default: 1,
    min: 0
  },
  note: {
    type: String,
    trim: true
  }
}, { timestamps: true, versionKey: false });

export const HomeProduct = mongoose.model("HomeProduct", homeProductSchema);

const homeShoppingItemSchema = new mongoose.Schema({
  home: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Home",
    required: true
  },
  productName: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    default: 1,
    min: 0.1
  },
  unit: {
    type: String,
    default: "ud"
  },
  status: {
    type: String,
    enum: ["pending", "bought"],
    default: "pending"
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  boughtBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  boughtAt: {
    type: Date
  }
}, { timestamps: true, versionKey: false });

export const HomeShoppingItem = mongoose.model("HomeShoppingItem", homeShoppingItemSchema);

const homePurchaseSchema = new mongoose.Schema({
  home: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Home",
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  unit: String,
  price: Number,
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true, versionKey: false });

export const HomePurchase = mongoose.model("HomePurchase", homePurchaseSchema);
