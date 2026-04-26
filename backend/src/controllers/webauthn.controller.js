import { generateAuthenticationOptions, generateRegistrationOptions, verifyAuthenticationResponse, verifyRegistrationResponse } from "@simplewebauthn/server";
import { isoBase64URL, isoUint8Array } from "@simplewebauthn/server/helpers";
import { env } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";
import { User } from "../models/user.model.js";
import { signToken } from "../utils/jwt.js";
import { verifyToken } from "../utils/jwt.js";

function sanitizeUserCredentials(user) {
  const current = Array.isArray(user.webauthnCredentials) ? user.webauthnCredentials : [];
  const sanitized = current.filter((c) => {
    return (
      c &&
      typeof c.credentialID === "string" &&
      c.credentialID.length > 0 &&
      typeof c.publicKey === "string" &&
      c.publicKey.length > 0
    );
  });

  if (sanitized.length !== current.length) {
    user.webauthnCredentials = sanitized;
    return true;
  }
  return false;
}

function sanitizeTransports(value) {
  const allowed = new Set([
    "usb",
    "nfc",
    "ble",
    "internal",
    "hybrid",
    "cable",
    "smart-card"
  ]);

  if (!Array.isArray(value)) return [];
  return value
    .map((t) => String(t || "").trim())
    .filter((t) => allowed.has(t));
}

function normalizeCounter(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function sanitizeUserCredentialsStrict(user) {
  const current = Array.isArray(user.webauthnCredentials) ? user.webauthnCredentials : [];
  const sanitized = current
    .filter((c) => {
      return (
        c &&
        typeof c.credentialID === "string" &&
        c.credentialID.length > 0 &&
        typeof c.publicKey === "string" &&
        c.publicKey.length > 0
      );
    })
    .map((c) => ({
      ...c,
      counter: normalizeCounter(c.counter),
      transports: sanitizeTransports(c.transports)
    }));

  const changed =
    sanitized.length !== current.length ||
    sanitized.some((c, i) => {
      const prev = current[i];
      if (!prev) return true;
      return (
        String(prev.counter) !== String(c.counter) ||
        JSON.stringify(Array.isArray(prev.transports) ? prev.transports : []) !== JSON.stringify(c.transports)
      );
    });

  if (changed) {
    user.webauthnCredentials = sanitized;
    return true;
  }
  return false;
}

function normalizeRpID(hostname) {
  if (!hostname) return hostname;
  const h = String(hostname).toLowerCase();
  if (h.startsWith("www.")) return h.slice(4);
  return h;
}

function getRpID(req) {
  const origin = req?.headers?.origin;
  if (origin) {
    try {
      return normalizeRpID(new URL(origin).hostname);
    } catch {
    }
  }

  const host = req?.headers?.host;
  if (host) {
    return normalizeRpID(String(host).split(":")[0]);
  }

  try {
    return normalizeRpID(new URL(env.FRONTEND_URL).hostname);
  } catch {
    return "localhost";
  }
}

function getExpectedOrigins(req) {
  const origin = req.headers.origin;
  const origins = [env.FRONTEND_URL].filter(Boolean);
  if (origin && !origins.includes(origin)) origins.push(origin);
  return origins;
}

export const getRegistrationOptions = async (req, res, next) => {
  try {
    const rpID = getRpID(req);
    const user = await User.findById(req.user._id);
    if (!user) throw new HttpError(401, "Usuario no válido");

    sanitizeUserCredentialsStrict(user);

    const excludeCredentials = (user.webauthnCredentials || [])
      .map((c) => {
        if (!c || !c.credentialID) return null;
        try {
          return {
            id: c.credentialID,
            type: "public-key",
            transports: c.transports || []
          };
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    const options = await generateRegistrationOptions({
      rpName: "Mis Finanzas",
      rpID,
      userID: isoUint8Array.fromUTF8String(user._id.toString()),
      userName: user.email || "user@misfinanzas.es",
      userDisplayName: user.name || "Usuario",
      attestationType: "none",
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred"
      },
      excludeCredentials
    });

    await User.updateOne(
      { _id: user._id },
      { $set: { webauthnCurrentChallenge: options.challenge } }
    );

    res.json({ ok: true, data: options });
  } catch (error) {
    console.error("WebAuthn Options Error:", error);
    next(error);
  }
};

export const verifyRegistration = async (req, res, next) => {
  try {
    const rpID = getRpID(req);
    const expectedOrigin = getExpectedOrigins(req);
    const user = await User.findById(req.user._id);
    if (!user) throw new HttpError(401, "Usuario no válido");
    if (!user.webauthnCurrentChallenge) throw new HttpError(400, "No hay challenge activo");

    sanitizeUserCredentialsStrict(user);

    const verification = await verifyRegistrationResponse({
      response: req.body,
      expectedChallenge: user.webauthnCurrentChallenge,
      expectedOrigin,
      expectedRPID: rpID
    });

    const { verified, registrationInfo } = verification;
    if (!verified || !registrationInfo) throw new HttpError(400, "Registro biométrico inválido");

    const credentialID = isoBase64URL.fromBuffer(Buffer.from(registrationInfo.credentialID));
    const publicKey = isoBase64URL.fromBuffer(Buffer.from(registrationInfo.credentialPublicKey));

    const exists = (user.webauthnCredentials || []).some((c) => c.credentialID === credentialID);
    if (!exists) {
      user.webauthnCredentials = [
        ...(user.webauthnCredentials || []),
        {
          credentialID,
          publicKey,
          counter: registrationInfo.counter,
          transports: req.body?.response?.transports || [],
          deviceType: registrationInfo.credentialDeviceType,
          backedUp: registrationInfo.credentialBackedUp
        }
      ];
    }

    if (!exists) {
      await User.updateOne(
        { _id: user._id },
        {
          $set: { biometricEnabled: true, webauthnCurrentChallenge: null },
          $push: {
            webauthnCredentials: {
              credentialID,
              publicKey,
              counter: registrationInfo.counter,
              transports: req.body?.response?.transports || [],
              deviceType: registrationInfo.credentialDeviceType,
              backedUp: registrationInfo.credentialBackedUp
            }
          }
        }
      );
    } else {
      await User.updateOne(
        { _id: user._id },
        { $set: { biometricEnabled: true, webauthnCurrentChallenge: null } }
      );
    }

    res.json({ ok: true, data: { biometricEnabled: true } });
  } catch (error) {
    next(error);
  }
};

export const getAuthenticationOptions = async (req, res, next) => {
  try {
    const email = String(req.query?.email || "").trim().toLowerCase();
    let userId = req.user?._id;
    if (!userId) {
      const header = req.headers.authorization || "";
      const [type, token] = header.split(" ");
      if (type === "Bearer" && token) {
        try {
          const decoded = verifyToken(token);
          userId = decoded?.sub;
        } catch {
        }
      }
    }
    const user = userId ? await User.findById(userId) : (email ? await User.findOne({ email }) : null);
    if (!user) throw new HttpError(400, "No hay huella configurada");
    sanitizeUserCredentialsStrict(user);
    const allowCredentials = (user.webauthnCredentials || [])
      .map((c) => {
        if (!c || !c.credentialID) return null;
        try {
          return {
            id: c.credentialID,
            type: "public-key",
            transports: c.transports || []
          };
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    if (!allowCredentials || allowCredentials.length === 0) {
      throw new HttpError(400, "No hay huella configurada");
    }

    const options = await generateAuthenticationOptions({
      rpID: getRpID(req),
      userVerification: "preferred",
      allowCredentials
    });

    await User.updateOne(
      { _id: user._id },
      { $set: { webauthnCurrentChallenge: options.challenge } }
    );

    res.json({ ok: true, data: options });
  } catch (error) {
    if (
      error &&
      (error.name === "Error" || error.name === "TypeError") &&
      String(error.message || "").toLowerCase().includes("transport")
    ) {
      return next(new HttpError(400, "Credencial biométrica inválida (transport). Vuelve a registrar la huella."));
    }
    next(error);
  }
};

export const verifyAuthentication = async (req, res, next) => {
  try {
    const rpID = getRpID(req);
    const expectedOrigin = getExpectedOrigins(req);
    const email = String(req.query?.email || req.body?.email || "").trim().toLowerCase();
    let userId = req.user?._id;
    if (!userId) {
      const header = req.headers.authorization || "";
      const [type, token] = header.split(" ");
      if (type === "Bearer" && token) {
        try {
          const decoded = verifyToken(token);
          userId = decoded?.sub;
        } catch {
        }
      }
    }
    const user = userId ? await User.findById(userId) : (email ? await User.findOne({ email }) : null);
    if (!user) throw new HttpError(400, "No hay huella configurada");
    if (!user.webauthnCurrentChallenge) throw new HttpError(400, "No hay challenge activo");

    sanitizeUserCredentialsStrict(user);

    const body = req.body;
    const credentialID = body?.id;
    if (!credentialID) throw new HttpError(400, "Respuesta biométrica inválida");

    const device = (user.webauthnCredentials || []).find((c) => c.credentialID === credentialID);
    if (!device) throw new HttpError(400, "Dispositivo no reconocido");

    let authenticator;
    try {
      authenticator = {
        credentialID: isoBase64URL.toBuffer(device.credentialID),
        credentialPublicKey: isoBase64URL.toBuffer(device.publicKey),
        counter: device.counter
      };
    } catch {
      throw new HttpError(400, "Dispositivo biométrico inválido");
    }

    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge: user.webauthnCurrentChallenge,
      expectedOrigin,
      expectedRPID: rpID,
      authenticator
    });

    const { verified, authenticationInfo } = verification;
    if (!verified || !authenticationInfo) throw new HttpError(400, "Autenticación biométrica inválida");

    const upd = await User.updateOne(
      { _id: user._id, "webauthnCredentials.credentialID": device.credentialID },
      {
        $set: {
          "webauthnCredentials.$.counter": authenticationInfo.newCounter,
          webauthnCurrentChallenge: null
        }
      }
    );
    if (!upd || upd.matchedCount === 0) throw new HttpError(400, "Dispositivo no reconocido");

    const token = signToken({ sub: user._id.toString() });
    res.json({ ok: true, data: { token } });
  } catch (error) {
    next(error);
  }
};
