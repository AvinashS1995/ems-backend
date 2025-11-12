import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },
  role: {
    type: String,
  },
  failedLoginAttempts: { type: Number, default: 0 },
  status: { type: String, default: "active" },
  lockUntil: { type: Date },

  lastLoginIp: { type: String },
  suspiciousIps: [{ type: String }],
  createAt: {
    type: Date,
    default: Date.now,
  },
  updateAt: {
    type: Date,
  },
});

const Admin = mongoose.model("Admin-User", adminSchema);

export { Admin };
