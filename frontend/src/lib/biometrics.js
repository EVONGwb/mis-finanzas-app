export const isBiometricsAvailable = async () => {
  if (!window.PublicKeyCredential) return false;
  return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
};

export const verifyBiometric = async () => {
  if (!window.PublicKeyCredential) {
    throw new Error("Biometría no soportada en este navegador");
  }

  // Desafío aleatorio (en producción vendría del servidor)
  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);

  const publicKey = {
    challenge,
    timeout: 60000,
    userVerification: "required", // Fuerza FaceID/TouchID/PIN
    rpId: window.location.hostname // Dominio actual
  };

  try {
    // Esto mostrará el prompt nativo del sistema
    const credential = await navigator.credentials.get({ publicKey });
    return !!credential; // Si devuelve algo, el usuario se autenticó
  } catch (error) {
    console.error("Error biométrico:", error);
    throw new Error("Autenticación biométrica fallida o cancelada");
  }
};
