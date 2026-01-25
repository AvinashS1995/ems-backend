import mongoose from "mongoose";

const WorkTrackingSchema = new mongoose.Schema({
  empNo: { type: String, required: true },

  date: { type: Date, required: true },

  projectName: { type: String },
  moduleName: { type: String },
  taskName: { type: String },
  taskType: { type: String },
  priority: { type: String },

  jiraId: { type: String },

  layer: { type: String },
  frontendTech: { type: String },
  backendTech: { type: String },
  componentOrApi: { type: String },
  apiIntegrated: { type: String },

  status: {
    type: String,
  },

  estimatedHours: { type: Number },
  actualHours: { type: Number },
  startDate: { type: Date },
  endDate: { type: Date },
  blocker: { type: String },

  repo: { type: String },
  branch: { type: String },
  baseBranch: { type: String },
  prNo: { type: String },
  reviewer: { type: String },
  prStatus: { type: String },
  mergeType: { type: String },
  mergeDate: { type: Date },

  deployedTo: { type: String },
  deploymentDate: { type: Date },
  deployedBy: { type: String },
  releaseVersion: { type: String },
  verifiedBy: { type: String },

  prodIssue: { type: String },
  prodIssueDesc: { type: String },
  fixApplied: { type: String },

  collaborationWith: { type: String },
  communicationMode: { type: String },
  remarks: { type: String },
  createAt: { type: Date, default: Date.now },
  updateAt: { type: Date },
});

const WorkTrackings = mongoose.model("WorkTrackings", WorkTrackingSchema);

export { WorkTrackings };
