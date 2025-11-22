import mongoose from "mongoose";
import bcrypt from "bcrypt";

const HomeSchema = new mongoose.Schema({
  name: { type: String, default: "" },
  description: { type: String, default: "" },
  roles: { type: [String], default: [] },
  profileImage: { type: String, default: "" },
  createdAt: { type: Date },
  updatedAt: { type: Date },
});

const Home = mongoose.model("Portfolio-Home", HomeSchema);

const StatsSchema = new mongoose.Schema({
  experience: { type: Number, default: 0 },
  clients: { type: Number, default: 0 },
  recruiters: { type: Number, default: 0 },
});

const AboutSchema = new mongoose.Schema({
  name: String,
  title: String,
  bio: String,
  bio2: String,
  profileImage: String,
  resumeFile: String,
  stats: StatsSchema,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  createdAt: { type: Date },
  updatedAt: { type: Date },
});

const About = mongoose.model("Portfolio-About", AboutSchema);

const ServiceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  icon: String,
  color: String,
  description: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  createdAt: { type: Date },
  updatedAt: { type: Date },
});

const Services = mongoose.model("Portfolio-Services", ServiceSchema);

const EducationSchema = new mongoose.Schema({
  degree: String,
  university: String,
  fromYear: String,
  toYear: String,
  currentlyStudying: { type: Boolean, default: false },
  // period: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  createdAt: { type: Date },
  updatedAt: { type: Date },
});

const Educations = mongoose.model("Portfolio-Education", EducationSchema);

const ExperienceSchema = new mongoose.Schema({
  company: String,
  role: String,
  fromYear: String,
  toYear: String,
  currentlyWorking: { type: Boolean, default: false },
  project: String,
  description: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  createdAt: { type: Date },
  updatedAt: { type: Date },
});

const Experiences = mongoose.model("Portfolio-Experience", ExperienceSchema);

const SkillSchema = new mongoose.Schema({
  name: { type: String, required: true },
  icon: { type: String },
});

const SkillCategorySchema = new mongoose.Schema({
  title: { type: String, required: true },
  color: { type: String, default: "#f58b49" },
  icon: { type: String },
  skills: [SkillSchema],
  createdAt: { type: Date },
  updatedAt: { type: Date },
});

const Skill = mongoose.model("Portfolio-Skill", SkillCategorySchema);

const ProjectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Project title is required"],
    trim: true,
  },
  category: {
    type: String,
    required: [true, "Category is required"],
    trim: true,
  },
  role: {
    type: String,
    required: [true, "Role / Tech stack is required"],
    trim: true,
  },
  image: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
    default: "",
  },
  codeLink: {
    type: String,
    default: "",
  },
  previewLink: {
    type: String,
    default: "",
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  createdAt: { type: Date },
  updatedAt: { type: Date },
});

const Projects = mongoose.model("Portfolio-Project", ProjectSchema);

const ContactInfoSchema = new mongoose.Schema({
  location: {
    company: String,
    address: String,
    city: String,
    country: String,
    postalCode: String,
    mapEmbedUrl: String,
  },
  email: String,
  phone: String,
  socialMedia: {
    linkedin: String,
    github: String,
    twitter: String,
    instagram: String,
    facebook: String,
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  createdAt: { type: Date },
  updatedAt: Date,
});

const Contacts = mongoose.model("Portfolio-Contact-Info", ContactInfoSchema);

const MessageSchema = new mongoose.Schema({
  name: String,
  email: String,
  subject: String,
  message: String,
  createdAt: { type: Date },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
});

const Messages = mongoose.model("Portfolio-Message", MessageSchema);

const locationSchema = new mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin-User" },
    ip: String,
    country: String,
    region: String,
    city: String,
    lat: Number,
    lng: Number,
    timezone: String,
  },
  { timestamps: true }
);

const Location = mongoose.model("Admin-Location", locationSchema);

const loginHistorySchema = new mongoose.Schema(
  {
    ip: String,
    userAgent: String,
    device: String,
    os: String,
    browser: String,
    location: locationSchema,
    sessionId: String,
    loggedInAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const LoginHistory = mongoose.model("Admin-Login-History", loginHistorySchema);

const activitySchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    description: String,
    ip: String,
    userAgent: String,
    device: String,
    status: { type: String, enum: ["success", "failed"], default: "success" },
  },
  { timestamps: true }
);

const Activity = mongoose.model("Admin-Activity-Log", activitySchema);

const adminSchema = new mongoose.Schema({
  username: { type: String, unique: true, trim: true },
  slug: { type: String, unique: true, trim: true },
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },
  role: {
    type: String,
  },
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  status: { type: String, default: "active" },
  isLoggedIn: { type: Boolean, default: false },
  lastLoginIp: { type: String },
  lastLoginAt: { type: Date },
  suspiciousIps: { type: [String], default: [] },
  loginHistory: [loginHistorySchema],
  activities: [activitySchema],
  home: HomeSchema,
  about: AboutSchema,
  contactInfo: ContactInfoSchema,
  services: [ServiceSchema],
  education: [EducationSchema],
  experience: [ExperienceSchema],
  skills: [SkillCategorySchema],
  projects: [ProjectSchema],
  messages: [MessageSchema],
  createdAt: {
    type: Date,
  },
  updatedAt: {
    type: Date,
  },
});

/* ----------------------------------------------------------
    AUTO GENERATE UNIQUE USERNAME AND SLUG
-----------------------------------------------------------*/
adminSchema.pre("save", async function (next) {
  // Only generate if fullName changed OR username missing
  if (!this.isModified("fullName") && this.username && this.slug) {
    return next();
  }

  let base = this.fullName.trim().toLowerCase().replace(/\s+/g, "-");

  // username
  let username = base;
  let counter = 1;

  while (await mongoose.model("Admin-User").findOne({ username })) {
    username = `${base}-${counter}`;
    counter++;
  }

  this.username = username;

  // slug (for portfolio URL)
  let slug = base;
  let counter2 = 1;

  while (await mongoose.model("Admin-User").findOne({ slug })) {
    slug = `${base}-${counter2}`;
    counter2++;
  }

  this.slug = slug;

  next();
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
    role: { type: String, required: true },
    createdBy: { type: String },
    stats: [
      {
        label: { type: String, required: true },
        count: { type: Number, required: true },
        icon: { type: String },
        link: { type: String },
        color: { type: String },
      },
    ],
  },
  { timestamps: true }
);

const DashboardStats = mongoose.model("Dashboard-Stats", dashboardStatSchema);

const AiUsageSchema = new mongoose.Schema(
  {
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    requestsThisMonth: { type: Number, default: 0 },
  },
  { timestamps: true }
);

AiUsageSchema.index({ month: 1, year: 1 }, { unique: true });

const AiUsage = mongoose.model("AiUsage", AiUsageSchema);

export {
  Admin,
  DashboardCards,
  DashboardStats,
  About,
  Services,
  Educations,
  Experiences,
  Projects,
  Contacts,
  Messages,
  AiUsage,
};
