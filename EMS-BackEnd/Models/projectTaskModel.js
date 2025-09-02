import mongoose from "mongoose";

const TaskSchema = new mongoose.Schema({
  taskId: {
    type: String,
    required: true,
    unique: true,
  },
  projectId: {
    type: String,
    required: true,
    unique: true,
  },
  title: {
    type: String,
    required: [true, "Task title is required"],
  },
  description: String,
  deadline: Date,
  attachments: [
    {
      fileName: String,
      fileUrl: String,
    },
  ],
  priority: {
    type: String,
    enum: ["High", "Medium", "Low"],
    default: "Medium",
  },
  expectedOutput: String,
  deliverables: String,
  milestones: String,
  status: {
    type: String,
    enum: ["Pending", "In Progress", "Completed"],
    default: "Pending",
  },
  assignTo: {
    empNo: { type: String, required: true },
    name: String,
    designation: String,
    role: String,
  },
  createdBy: {
    empNo: { type: String, required: true },
    name: String,
    role: String,
  },
  updatedBy: {
    empNo: { type: String, required: true },
    name: String,
    role: String,
  },
  createAt: { type: Date, default: Date.now },
  updateAt: { type: Date, default: Date.now },
});

const ProjectSchema = new mongoose.Schema({
  projectId: {
    type: String,
    unique: true,
    required: true,
  },
  title: {
    type: String,
    required: [true, "Project title is required"],
  },
  description: String,
  deadline: Date,
  attachments: [
    {
      fileName: String,
      fileUrl: String,
    },
  ],
  priority: {
    type: String,
    enum: ["High", "Medium", "Low"],
    default: "Medium",
  },
  deliverables: String,
  milestones: String,
  createdBy: {
    empNo: { type: String, required: true },
    name: String,
    role: String,
  },
  assignTo: {
    empNo: { type: String, required: true },
    name: String,
    designation: String,
    role: String,
  },
  tasks: [TaskSchema],
  createAt: { type: Date, default: Date.now },
  updateAt: { type: Date, default: Date.now },
});

const Projects = mongoose.model("Projects", ProjectSchema);

export { Projects };
