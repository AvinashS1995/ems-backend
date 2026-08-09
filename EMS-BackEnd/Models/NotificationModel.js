import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    // ==========================================
    // BASIC
    // ==========================================

    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    // ==========================================
    // MODULE
    // ==========================================

    module: {
      type: String,
      // enum: [
      //   "Attendance",
      //   "Leave",
      //   "Payroll",
      //   "Project",
      //   "Task",
      //   "Meeting",
      //   "Schedule",
      //   "Popup",
      //   "System",
      // ],
      required: true,
      index: true,
    },

    // ==========================================
    // EVENT
    // ==========================================

    event: {
      type: String,
      required: true,
      index: true,
    },

    // ==========================================
    // RECIPIENT
    // ==========================================

    recipientEmployee: {
      type: String,
      required: true,
      index: true,
    },

    recipientEmail: {
      type: String,
      default: "",
    },

    // ==========================================
    // CREATED BY
    // ==========================================

    createdByEmployee: {
      type: String,
      default: null,
    },

    createdByName: {
      type: String,
      default: null,
    },

    // ==========================================
    // UI
    // ==========================================

    icon: {
      type: String,
      default: "notifications",
    },

    color: {
      type: String,
      default: "#2196F3",
    },

    // ==========================================
    // READ STATUS
    // ==========================================

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    readAt: {
      type: Date,
      default: null,
    },

    // ==========================================
    // NAVIGATION
    // ==========================================

    route: {
      type: String,
      default: null,
    },

    // ==========================================
    // RELATED RECORD
    // ==========================================

    referenceId: {
      type: String,
      default: null,
    },

    referenceType: {
      type: String,
      default: null,
    },

    // ==========================================
    // EXTRA DATA
    // ==========================================

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // ==========================================
    // EXPIRY
    // ==========================================

    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Useful index for notification listing
notificationSchema.index({
  recipientEmployee: 1,
  isRead: 1,
  createdAt: -1,
});

// Useful index for module based notification
notificationSchema.index({
  recipientEmployee: 1,
  module: 1,
  createdAt: -1,
});

const Notification = mongoose.model("Notification", notificationSchema);

export { Notification };
