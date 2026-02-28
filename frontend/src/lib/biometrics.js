// Helper para convertir ArrayBuffer a Base64 y viceversa
const bufferToBase64 = (buffer) => {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
};

const base64ToBuffer = (base64) => {
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
};

export const isBiometricsAvailable = async () => {
  if (!window.PublicKeyCredential) return false;
  return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
};

export const verifyBiometric = async () => {
  if (!window.PublicKeyCredential) {
    throw new Error("Biometría no soportada en este navegador");
  }

  // Desafío aleatorio
  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);

  // Check registration (V3 for non-resident simplified UI)
  const isRegistered = localStorage.getItem("bio_v3_registered") === "true";
  const credentialId = localStorage.getItem("bio_credential_id");

  if (!isRegistered || !credentialId) {
    console.log("No registered credential found (v3), registering new one...");
    return await registerDummyCredential();
  }

  const publicKey = {
    challenge,
    timeout: 60000,
    userVerification: "required", 
    rpId: window.location.hostname,
    allowCredentials: [{
      type: "public-key",
      id: base64ToBuffer(credentialId),
      transports: ["internal"]
    }]
  };

  try {
    return await navigator.credentials.get({ publicKey });
  } catch (error) {
    console.warn("Error verifying biometric:", error);
    // If user cancelled, DO NOT retry with registration to avoid double prompt
    if (error.name === "NotAllowedError" || error.name === "AbortError") {
      throw error; 
    }
    // If it fails for other reasons (e.g. invalid ID), try re-registering
    return await registerDummyCredential();
  }
};

const registerDummyCredential = async () => {
  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);

  const publicKey = {
    challenge,
    rp: { name: "Mis Finanzas", id: window.location.hostname },
    user: {
      id: new Uint8Array(16),
      name: "user",
      displayName: "Usuario"
    },
    pubKeyCredParams: [{ alg: -7, type: "public-key" }],
    authenticatorSelection: { 
      userVerification: "required",
      authenticatorAttachment: "platform", 
      requireResidentKey: false, // Simplifies UI
      residentKey: "discouraged"
    },
    timeout: 60000,
    attestation: "none"
  };

  try {
    const credential = await navigator.credentials.create({ publicKey });
    if (credential) {
      localStorage.setItem("bio_v3_registered", "true");
      localStorage.setItem("bio_credential_id", bufferToBase64(credential.rawId));
    }
    return !!credential;
  } catch (e) {
    console.error("Falló el registro dummy:", e);
    throw new Error("No se pudo activar la biometría.");
  }
};
