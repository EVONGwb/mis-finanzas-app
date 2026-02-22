import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { User } from "../models/user.model.js";
import { HttpError } from "../utils/httpError.js";
import { signToken } from "../utils/jwt.js";
import { env } from "../config/env.js";

const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);

function isEmailValid(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function register(req, res, next) {
  try {
    const { email, password, name = "" } = req.body;

    if (!email || !password) throw new HttpError(400, "Falta email o password");
    if (!isEmailValid(email)) throw new HttpError(400, "Email inválido");
    if (String(password).length < 6) throw new HttpError(400, "Password mínimo 6 caracteres");

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) throw new HttpError(409, "Ese email ya existe");

    const passwordHash = await bcrypt.hash(String(password), 10);
    const user = await User.create({ email, name, role: "user", passwordHash });

    const token = signToken({ sub: user._id.toString() });
    return res.status(201).json({
      ok: true,
      data: { token, user: { _id: user._id, email: user.email, name: user.name, role: user.role } }
    });
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
    if (!email || !password) throw new HttpError(400, "Falta email o password");

    const user = await User.findOne({ email: String(email).toLowerCase() }).select("+passwordHash");
    if (!user) throw new HttpError(401, "Credenciales incorrectas");

    const ok = await bcrypt.compare(String(password), user.passwordHash);
    if (!ok) throw new HttpError(401, "Credenciales incorrectas");

    const token = signToken({ sub: user._id.toString() });
    return res.json({
      ok: true,
      data: { token, user: { _id: user._id, email: user.email, name: user.name, role: user.role } }
    });
  } catch (err) {
    return next(err);
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
    return res.json({
      ok: true,
      data: { token, user: { _id: user._id, email: user.email, name: user.name, role: user.role, avatar: user.avatar } }
    });
  } catch (err) {
    return next(err);
  }
}

