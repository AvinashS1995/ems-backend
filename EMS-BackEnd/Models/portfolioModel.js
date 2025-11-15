import mongoose from "mongoose";
import bcrypt from "bcrypt";

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
  resumeUrl: String,
  stats: StatsSchema,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
});

const About = mongoose.model("Portfolio-About", AboutSchema);

const ServiceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  icon: String,
  color: String,
  description: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
});

const Services = mongoose.model("Portfolio-Services", ServiceSchema);

const EducationSchema = new mongoose.Schema({
  degree: String,
  university: String,
  period: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
});

const Educations = mongoose.model("Portfolio-Education", EducationSchema);

const ExperienceSchema = new mongoose.Schema({
  company: String,
  role: String,
  period: String,
  project: String,
  description: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
});

const Experiences = mongoose.model("Portfolio-Experience", ExperienceSchema);

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
    required: [true, "Image URL is required"],
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
  createdAt: { type: Date, default: Date.now },
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
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date,
});

const Contacts = mongoose.model("Portfolio-Contact-Info", ContactInfoSchema);

const MessageSchema = new mongoose.Schema({
  name: String,
  email: String,
  subject: String,
  message: String,
  createdAt: { type: Date, default: Date.now },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
});

const Messages = mongoose.model("Portfolio-Message", MessageSchema);

const adminSchema = new mongoose.Schema({
  username: { type: String, unique: true, trim: true },
  // 👇 NEW: SEO-friendly slug for portfolio URL
  slug: { type: String, unique: true, trim: true },
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
  about: AboutSchema,
  contactInfo: ContactInfoSchema,
  services: [ServiceSchema],
  education: [EducationSchema],
  experience: [ExperienceSchema],
  projects: [ProjectSchema],
  messages: [MessageSchema],
  createAt: {
    type: Date,
    default: Date.now,
  },
  updateAt: {
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
};
