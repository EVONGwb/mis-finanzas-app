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

  // NOTA IMPORTANTE:
  // navigator.credentials.get() busca credenciales "Passkeys" registradas previamente en el dominio.
  // Como no estamos registrando Passkeys reales (navigator.credentials.create), sino solo usando la biometría local como "candado",
  // el navegador puede quejarse de que "no hay llaves".
  //
  // SOLUCIÓN:
  // En lugar de intentar recuperar una Passkey inexistente, usamos la API de autenticación web solo si existe credencial,
  // O BIEN, para este caso de uso simple (candado local), simulamos la verificación si el dispositivo lo soporta.
  // Pero para que funcione el prompt nativo sin Passkeys reales, necesitamos crear una credencial dummy primero o usar una librería de envoltura.
  //
  // ALTERNATIVA RÁPIDA: Usar 'create' en lugar de 'get' la primera vez para registrar el dispositivo,
  // pero eso es complejo sin backend.
  //
  // PLAN B (Simulación Segura Local):
  // Si el usuario ya inició sesión y guardó el token, asumimos que "activar biometría" significa confiar en el bloqueo de pantalla del dispositivo.
  // Lamentablemente, la API WebAuthn NO permite simplemente "pedir huella" sin una llave registrada.
  //
  // CORRECCIÓN: Vamos a intentar crear una credencial temporal la primera vez.
  
  const publicKey = {
    challenge,
    timeout: 60000,
    userVerification: "required", 
    rpId: window.location.hostname
  };

  try {
    // Intentamos obtener. Si falla porque no hay credenciales, significa que necesitamos registrar una primero.
    // Pero como no tenemos backend de WebAuthn, este enfoque puro fallará.
    //
    // CAMBIO DE ESTRATEGIA:
    // Para una PWA sin backend WebAuthn completo, lo mejor es usar un fallback o simplemente
    // asumir que si el usuario activa el check, confía en el localStorage.
    // Pero el usuario quiere ver el prompt de huella.
    //
    // Truco: Usar `navigator.credentials.create` para "registrar" una llave dummy en el dispositivo
    // y luego usar `get` para verificarla.
    
    // Si estamos en modo verificación, intentamos get.
    return await navigator.credentials.get({ publicKey });
  } catch (error) {
    console.warn("No se encontró credencial, intentando registrar una nueva silenciosamente...", error);
    // Si falla, intentamos crear una credencial local para habilitar el uso futuro
    return await registerDummyCredential();
  }
};

const registerDummyCredential = async () => {
  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);

  const publicKey = {
    challenge,
    rp: { name: "Mis Finanzas App", id: window.location.hostname },
    user: {
      id: new Uint8Array(16), // ID dummy
      name: "usuario_local",
      displayName: "Usuario Local"
    },
    pubKeyCredParams: [{ alg: -7, type: "public-key" }],
    authenticatorSelection: { 
      userVerification: "required",
      authenticatorAttachment: "platform", // Fuerza a usar el dispositivo local (FaceID/TouchID) y evita preguntas extra
      requireResidentKey: false
    },
    timeout: 60000
  };

  try {
    const credential = await navigator.credentials.create({ publicKey });
    return !!credential;
  } catch (e) {
    console.error("Falló el registro dummy:", e);
    throw new Error("No se pudo activar la biometría. Tu dispositivo podría no soportarlo.");
  }
};
