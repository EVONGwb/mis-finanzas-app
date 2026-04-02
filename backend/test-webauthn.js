import mongoose from "mongoose";
import { getRegistrationOptions } from "./src/controllers/webauthn.controller.js";
import { env } from "./src/config/env.js";
import { User } from "./src/models/user.model.js";

async function test() {
  await mongoose.connect(env.MONGODB_URI);
  const req = {
    headers: { origin: "https://mis-finanzas-app.onrender.com" },
    user: { _id: "67900b953d6cd8e6822e1762" }
  };
  const res = {
    json: (data) => console.log("RES:", JSON.stringify(data, null, 2)),
    status: (s) => ({ json: (d) => console.log("STATUS", s, d) })
  };
  
  // mock User
  User.findById = async () => ({
    _id: "123",
    email: "test@test.com",
    webauthnCredentials: [{ credentialID: undefined }],
    save: async () => {}
  });

  await getRegistrationOptions(req, res, (err) => console.error("NEXT ERR:", err));
  process.exit(0);
}
test();
