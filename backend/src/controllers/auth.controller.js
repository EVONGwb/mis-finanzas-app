import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { User } from "../models/user.model.js";
import { HttpError } from "../utils/httpError.js";
import { signToken } from "../utils/jwt.js";
import { verifyToken } from "../utils/jwt.js";
import { env } from "../config/env.js";

const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);

function isEmailValid(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function parseExpiresInMs(expiresIn) {
  const raw = String(expiresIn || "").trim();
  const match = raw.match(/^(\d+)\s*([smhd])$/i);
  if (!match) return null;
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return Number.isFinite(amount) && amount > 0 ? amount * multipliers[unit] : null;
}

function setSessionCookie(res, token) {
  const isProd = env.NODE_ENV === "production";
  const maxAge = parseExpiresInMs(env.JWT_EXPIRES_IN) ?? 7 * 24 * 60 * 60 * 1000;
  res.cookie("mf_session", token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
    maxAge
  });
}

function clearSessionCookie(res) {
  const isProd = env.NODE_ENV === "production";
  res.clearCookie("mf_session", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/"
  });
}

function parseCookies(header) {
  const raw = String(header || "");
  if (!raw) return {};
  return raw.split(";").reduce((acc, part) => {
    const idx = part.indexOf("=");
    if (idx === -1) return acc;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (!key) return acc;
    acc[key] = decodeURIComponent(value);
    return acc;
  }, {});
}

export async function register(req, res, next) {
  try {
    throw new HttpError(410, "Registro con email/contraseña deshabilitado. Usa Google.");
  } catch (err) {
    return next(err);
  }
}

export async function registerAdmin(req, res, next) {
  try {
    const { email, password, name = "", role = "user" } = req.body;

    if (!email || !password) throw new HttpError(400, "Falta email o password");
    if (!isEmailValid(email)) throw new HttpError(400, "Email inválido");
    if (String(password).length < 6) throw new HttpError(400, "Password mínimo 6 caracteres");
    if (role && !["user", "admin"].includes(role)) throw new HttpError(400, "Role inválido");

    const exists = await User.findOne({ email: String(email).toLowerCase() });
    if (exists) throw new HttpError(409, "Ese email ya existe");

    const passwordHash = await bcrypt.hash(String(password), 10);
    const user = await User.create({ email, name, role, passwordHash });

    return res.status(201).json({
      ok: true,
      data: { _id: user._id, email: user.email, name: user.name, role: user.role }
    });
  } catch (err) {
    return next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new HttpError(400, "Falta email o contraseña");
    }

    // Buscamos el usuario y pedimos explícitamente el passwordHash que está oculto por defecto
    const user = await User.findOne({ email: String(email).toLowerCase() }).select("+passwordHash");

    if (!user || !user.passwordHash) {
      throw new HttpError(401, "Credenciales inválidas");
    }

    const isMatch = await bcrypt.compare(String(password), user.passwordHash);
    if (!isMatch) {
      throw new HttpError(401, "Credenciales inválidas");
    }

    const token = signToken({ sub: user._id.toString() });
    setSessionCookie(res, token);

    return res.json({
      ok: true,
      data: {
        token,
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar
        }
      }
    });
  } catch (err) {
    return next(err);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const { name, currency } = req.body;
    const userId = req.user._id;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (currency !== undefined) updates.currency = currency;

    const user = await User.findByIdAndUpdate(userId, updates, { new: true });

    res.json({
      ok: true,
      data: { _id: user._id, email: user.email, name: user.name, role: user.role, currency: user.currency }
    });
  } catch (err) {
    next(err);
  }
}

export async function googleLogin(req, res, next) {
  try {
    const { idToken, accessToken } = req.body;
    if (!idToken && !accessToken) throw new HttpError(400, "Falta idToken o accessToken");

    let email, name, picture, googleId;

    if (idToken) {
      // Verify ID token
      const ticket = await client.verifyIdToken({
        idToken,
        audience: env.GOOGLE_CLIENT_ID
      });
      const payload = ticket.getPayload();
      email = payload.email;
      name = payload.name;
      picture = payload.picture;
      googleId = payload.sub;
    } else if (accessToken) {
      // Verify Access Token and get user info
      const tokenInfo = await client.getTokenInfo(accessToken);
      
      // Use the access token to get user details
      // google-auth-library doesn't automatically fetch profile with getTokenInfo, 
      // so we might need to use the client to request userinfo endpoint
      client.setCredentials({ access_token: accessToken });
      const userinfo = await client.request({
        url: 'https://www.googleapis.com/oauth2/v3/userinfo'
      });
      
      email = userinfo.data.email;
      name = userinfo.data.name;
      picture = userinfo.data.picture;
      googleId = userinfo.data.sub;
    }

    if (!email) throw new HttpError(400, "Token inválido (sin email)");

    // Find or create user
    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Create new user
      user = await User.create({
        email: email.toLowerCase(),
        name: name || "",
        googleId,
        avatar: picture,
        role: "user",
        // Password is required in schema but we made it optional or handled?
        // Wait, schema says passwordHash is optional now.
      });
    } else {
      // Update existing user with googleId if missing
      if (!user.googleId) {
        user.googleId = googleId;
        if (!user.avatar) user.avatar = picture;
        await user.save();
      }
    }

    const token = signToken({ sub: user._id.toString() });
    setSessionCookie(res, token);
    return res.json({
      ok: true,
      data: { token, user: { _id: user._id, email: user.email, name: user.name, role: user.role, avatar: user.avatar } }
    });
  } catch (err) {
    return next(err);
  }
}

export async function logout(req, res, next) {
  try {
    clearSessionCookie(res);
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
}

export async function getSession(req, res, next) {
  try {
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies.mf_session || "";
    if (!token) {
      return res.json({ ok: true, data: { authenticated: false } });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch {
      clearSessionCookie(res);
      return res.json({ ok: true, data: { authenticated: false } });
    }

    const user = await User.findById(decoded?.sub).select("-passwordHash");
    if (!user) {
      clearSessionCookie(res);
      return res.json({ ok: true, data: { authenticated: false } });
    }

    return res.json({ ok: true, data: { authenticated: true, user } });
  } catch (err) {
    return next(err);
  }
}
