import mongoose from "mongoose";
import bcrypt from "bcrypt";

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
  suspiciousIps: { type: [String], default: [] },
  activities: [
    {
      action: String,
      ip: String,
      timestamp: { type: Date, default: Date.now },
    },
  ],
  isLoggedIn: { type: Boolean, default: false },
  createAt: {
    type: Date,
    default: Date.now,
  },
  updateAt: {
    type: Date,
  },
});

//
// ✅ Virtual: check if account is locked
//
adminSchema.virtual("isLocked").get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

//
// ✅ Hash password before saving
//
adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

//
// ✅ Method: compare password
//
adminSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

//
// ✅ Method: increment failed attempts and handle lock logic
//
adminSchema.methods.incrementLoginAttempts = async function () {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    // Lock expired — reset
    this.failedLoginAttempts = 1;
    this.lockUntil = undefined;
    this.status = "active";
  } else {
    this.failedLoginAttempts += 1;
    // Lock after 3 failed attempts
    if (this.failedLoginAttempts >= 3 && !this.isLocked) {
      this.lockUntil = Date.now() + 15 * 60 * 1000; // 15 mins lock
      this.status = "locked";
    }
  }
  await this.save();
};

//
// ✅ Method: reset attempts and unlock account
//
adminSchema.methods.resetLoginAttempts = async function () {
  this.failedLoginAttempts = 0;
  this.lockUntil = undefined;
  this.status = "active";
  await this.save();
};

const Admin = mongoose.model("Admin-User", adminSchema);

const dashboardCardSchema = new mongoose.Schema(
  {
    role: { type: String, required: true },
    createdBy: { type: String },
    cards: [
      {
        icon: { type: String },
        title: { type: String, required: true },
        desc: { type: String },
        link: { type: String },
      },
    ],
  },
  { timestamps: true }
);

const DashboardCards = mongoose.model("Dashboard-Cards", dashboardCardSchema);

const dashboardStatSchema = new mongoose.Schema(
  {
    stats: [
      {
        label: { type: String, required: true },
        count: { type: Number, required: true },
        icon: { type: String },
        link: { type: String },
        color: { type: String },
        createdBy: { type: String },
      },
    ],
  },
  { timestamps: true }
);

const DashboardStats = mongoose.model("Dashboard-States", dashboardStatSchema);

export { Admin, DashboardCards, DashboardStats };
