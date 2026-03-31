import { generateAuthenticationOptions, generateRegistrationOptions, verifyAuthenticationResponse, verifyRegistrationResponse } from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { env } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";
import { User } from "../models/user.model.js";
import { signToken } from "../utils/jwt.js";

function getRpID(req) {
  const origin = req?.headers?.origin;
  if (origin) {
    try {
      return new URL(origin).hostname;
    } catch {
    }
  }

  const host = req?.headers?.host;
  if (host) {
    return String(host).split(":")[0];
  }

  try {
    return new URL(env.FRONTEND_URL).hostname;
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

    const excludeCredentials = (user.webauthnCredentials || []).map((c) => ({
      id: isoBase64URL.toBuffer(c.credentialID),
      type: "public-key",
      transports: c.transports
    }));

    const options = await generateRegistrationOptions({
      rpName: "Mis Finanzas",
      rpID,
      userID: Buffer.from(user._id.toString()),
      userName: user.email,
      attestationType: "none",
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        residentKey: "required",
        userVerification: "preferred"
      },
      excludeCredentials
    });

    user.webauthnCurrentChallenge = options.challenge;
    await user.save();

    res.json({ ok: true, data: options });
  } catch (error) {
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

    user.biometricEnabled = true;
    user.webauthnCurrentChallenge = null;
    await user.save();

    res.json({ ok: true, data: { biometricEnabled: true } });
  } catch (error) {
    next(error);
  }
};

export const getAuthenticationOptions = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) throw new HttpError(401, "Usuario no válido");
    if (!user.webauthnCredentials || user.webauthnCredentials.length === 0) {
      throw new HttpError(400, "No hay huella configurada");
    }

    const options = await generateAuthenticationOptions({
      rpID: getRpID(req),
      userVerification: "preferred",
      allowCredentials: user.webauthnCredentials.map((c) => ({
        id: isoBase64URL.toBuffer(c.credentialID),
        type: "public-key",
        transports: c.transports
      }))
    });

    user.webauthnCurrentChallenge = options.challenge;
    await user.save();

    res.json({ ok: true, data: options });
  } catch (error) {
    next(error);
  }
};

export const verifyAuthentication = async (req, res, next) => {
  try {
    const rpID = getRpID(req);
    const expectedOrigin = getExpectedOrigins(req);
    const user = await User.findById(req.user._id);
    if (!user) throw new HttpError(401, "Usuario no válido");
    if (!user.webauthnCurrentChallenge) throw new HttpError(400, "No hay challenge activo");

    const body = req.body;
    const credentialID = body?.id;
    if (!credentialID) throw new HttpError(400, "Respuesta biométrica inválida");

    const device = (user.webauthnCredentials || []).find((c) => c.credentialID === credentialID);
    if (!device) throw new HttpError(400, "Dispositivo no reconocido");

    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge: user.webauthnCurrentChallenge,
      expectedOrigin,
      expectedRPID: rpID,
      authenticator: {
        credentialID: isoBase64URL.toBuffer(device.credentialID),
        credentialPublicKey: isoBase64URL.toBuffer(device.publicKey),
        counter: device.counter
      }
    });

    const { verified, authenticationInfo } = verification;
    if (!verified || !authenticationInfo) throw new HttpError(400, "Autenticación biométrica inválida");

    device.counter = authenticationInfo.newCounter;
    user.webauthnCurrentChallenge = null;
    await user.save();

    const token = signToken({ sub: user._id.toString() });
    res.json({ ok: true, data: { token } });
  } catch (error) {
    next(error);
  }
};
