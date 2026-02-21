import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
  actor: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    email: { type: String },
    role: { type: String }
  },
  action: {
    type: String,
    enum: [
      "USER_CREATE",
      "USER_UPDATE",
      "USER_DELETE",
      "USER_ROLE_CHANGE",
      "USER_PASSWORD_RESET",
      "LOGIN_SUCCESS",
      "LOGIN_FAILED",
      "OTHER"
    ],
    required: true
  },
  entity: { type: String, required: true },
  entityId: { type: String },
  message: { type: String },
  before: { type: mongoose.Schema.Types.Mixed },
  after: { type: mongoose.Schema.Types.Mixed },
  meta: {
    ip: { type: String },
    userAgent: { type: String },
    origin: { type: String },
    path: { type: String },
    method: { type: String }
  }
}, {
  timestamps: true,
  versionKey: false
});

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
