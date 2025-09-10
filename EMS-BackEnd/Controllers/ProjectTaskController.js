import { generateId } from "../common/common.js";
import { getApprovalStepManagetToEmployees } from "../common/employee.utilis.js";
import { ApprovalFlow } from "../Models/approvalModel.js";
import { Projects } from "../Models/projectTaskModel.js";
import { User } from "../Models/UserModel.js";

const typeMap = {
  "Project Assign Request": "Projects",
};

export const createProject = async (req, res) => {
  try {
    const {
      title,
      description,
      deadline,
      attachments,
      priority,
      deliverables,
      milestones,
      createdBy,
      assignTo,
    } = req.body;

    if (!title || !createdBy?.empNo || !assignTo?.empNo) {
      return res.status(400).json({
        status: "fail",
        message: "Project title, createdBy, and assignTo are required",
      });
    }

    // 1. Fetch creator & TL user info
    const creator = await User.findOne({ empNo: createdBy.empNo });
    const teamLeader = await User.findOne({ empNo: assignTo.empNo });

    if (!creator || !teamLeader) {
      return res.status(404).json({
        status: "fail",
        message: "Creator or Team Leader not found",
      });
    }

    const projectId = await generateId(Projects, "PRJ", "projectId");

    const modelName = "Projects"; // registered mongoose model
    const displayName = "Project Assign Request";
    // console.log(typeName);

    // 3. Fetch Approval flow (Project Assign Request)
    const approvalFlow = await ApprovalFlow.findOne({
      typeName: "Projects",
      displayName: "Project Assign Request",
    });
    console.log(approvalFlow);
    if (!approvalFlow) {
      return res.status(404).json({
        status: "fail",
        message: "Approval flow not found for Project Assign Request",
      });
    }

    // 4. Initial status = Submitted by Manager
    const initialStatus = [
      {
        role: creator.role,
        empNo: creator.empNo,
        name: `${creator.firstName} ${creator.lastName}`,
        status: "Submitted",
        comments: null,
        actionDate: new Date(),
      },
    ];

    // Stepper data (exclude applicant role)
    let stepperData = await getApprovalStepManagetToEmployees(
      creator.empNo,
      approvalFlow.listApprovalFlowDetails,
      initialStatus,
      creator.role
    );

    console.log(stepperData);

    // 🔑 Filter out duplicate applicant
    stepperData = stepperData.filter((step) => step.role !== creator.role);

    const approvalStatus = [
      ...initialStatus,
      ...stepperData.map((step) => ({
        role: step.role,
        empNo: step.empNo,
        name: step.name.split(" - ")[0],
        status: step.status || "Pending",
        comments: step.comments || null,
        actionDate: step.actionDate || null,
      })),
    ];

    const pendingStep = approvalStatus.find((s) => s.status === "Pending");
    const status = pendingStep ? `Pending for ${pendingStep.role}` : "Approved";

    const newProject = new Projects({
      projectId,
      title,
      description,
      deadline,
      attachments,
      priority,
      deliverables,
      milestones,
      createdBy,
      assignTo,
      status,
      type: approvalFlow.type,
      approvalFlowId: approvalFlow._id,
      approvalStatus,
    });

    await newProject.save();

    res.status(201).json({
      status: "success",
      message: "Project created successfully",
      data: {
        projectId,
        project: newProject,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "fail", message: error.message });
  }
};

export const approveRejectProject = async (req, res) => {
  try {
    const { projectId, action, comments, approverEmpNo } = req.body;

    const project = await Projects.findOne({ projectId });
    if (!project) {
      return res
        .status(404)
        .json({ status: "fail", message: "Project not found" });
    }

    const approver = await User.findOne({ empNo: approverEmpNo });
    if (!approver) {
      return res
        .status(404)
        .json({ status: "fail", message: "Approver not found" });
    }

    const role = approver.role;

    // Prevent duplicate action
    const alreadyActed = project.approvalStatus.find(
      (step) =>
        step.empNo === approverEmpNo &&
        step.role === role &&
        step.status !== "Pending"
    );
    if (alreadyActed) {
      return res
        .status(400)
        .json({ status: "fail", message: "You have already taken action" });
    }

    // Remove old pending entry
    project.approvalStatus = project.approvalStatus.filter(
      (s) =>
        !(
          s.empNo === approverEmpNo &&
          s.role === role &&
          s.status === "Pending"
        )
    );

    // Add current approver action
    project.approvalStatus.push({
      role,
      empNo: approverEmpNo,
      name: `${approver.firstName} ${approver.lastName}`,
      status: action === "Approved" ? "Approved" : "Rejected",
      comments,
      actionDate: new Date(),
    });

    // Fetch flow for Project Assign Request
    const approvalFlow = await ApprovalFlow.findOne({
      typeName: "Project Assign Request",
    });
    const flowSteps = approvalFlow?.listApprovalFlowDetails || [];

    const stepperData = await getApprovalStepManagetToEmployees(
      project.createdBy.empNo,
      flowSteps,
      project.approvalStatus,
      approver.role
    );

    const nextPending = stepperData.find((step) => step.status === "Pending");

    if (action === "Rejected") {
      project.status = `Rejected by ${role}`;
    } else if (!nextPending) {
      project.status = "Approved";
    } else {
      project.status = `Pending for ${nextPending.role}`;
      project.approvalStatus.push({
        role: nextPending.role,
        empNo: nextPending.empNo,
        name: nextPending.name.split(" - ")[0],
        status: "Pending",
        comments: null,
        actionDate: null,
      });
    }

    project.updatedBy = approverEmpNo;
    project.updateAt = new Date();

    const updatedProject = await project.save();

    res.status(200).json({
      status: "success",
      message: `Project ${action}ed successfully`,
      data: updatedProject,
    });
  } catch (error) {
    console.error("Error in approveRejectProject:", error);
    res.status(500).json({ status: "fail", message: error.message });
  }
};

export const ProjectRequestList = async (req, res) => {
  try {
    const { approverEmpNo } = req.body;

    const projects = await Projects.find({
      approvalStatus: {
        $elemMatch: { empNo: approverEmpNo, status: "Pending" },
      },
    }).sort({ createAt: -1 });

    res.status(200).json({
      status: "success",
      message: "Record(s) Fetched Successfully!",
      data: {
        projects,
        totalRecords: projects.length,
      },
    });
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};

export const createTask = async (req, res) => {
  try {
    const {
      projectId,
      title,
      description,
      deadline,
      attachments,
      priority,
      expectedOutput,
      deliverables,
      milestones,
      assignTo,
      createdBy,
      status,
    } = req.body;

    const fields =
      !projectId ||
      !title ||
      !deadline ||
      !assignTo?.empNo ||
      !createdBy?.empNo;

    if (fields) {
      return res.status(400).json({
        status: "fail",
        message: `${fields} are required`,
      });
    }

    const project = await Projects.findOne({ projectId });
    if (!project) {
      return res.status(404).json({
        status: "fail",
        message: "Project not found",
      });
    }

    const taskId = await generateId(Projects, "TSK", "tasks.taskId");

    const newTask = {
      taskId,
      projectId,
      title,
      description,
      deadline,
      attachments,
      priority,
      expectedOutput,
      deliverables,
      milestones,
      assignTo,
      createdBy,
      status,
    };

    project.tasks.push(newTask);
    project.updateAt = new Date();

    await project.save();

    res.status(201).json({
      status: "success",
      message: "Task created successfully",
      data: { taskId, task: newTask },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "fail", message: error.message });
  }
};

export const updateTaskStatus = async (req, res) => {
  try {
    const { projectId, taskId, status, updatedBy } = req.body;

    if (!projectId || !taskId || !status) {
      return res.status(400).json({
        status: "fail",
        message: "projectId, taskId, and status are required",
      });
    }

    const project = await Projects.findOne({ projectId });
    if (!project) {
      return res.status(404).json({
        status: "fail",
        message: "Project not found",
      });
    }

    const task = project.tasks.find((t) => t.taskId === taskId);
    if (!task) {
      return res.status(404).json({
        status: "fail",
        message: "Task not found",
      });
    }

    task.status = status;
    task.updatedBy = updatedBy;
    task.updateAt = new Date();
    project.updateAt = new Date();

    await project.save();

    res.status(200).json({
      status: "success",
      message: "Task status updated successfully",
      data: { taskId: task.taskId, status: task.status },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "fail", message: error.message });
  }
};

export const getProjects = async (req, res) => {
  try {
    const projects = await Projects.find().sort({ createAt: -1 });
    res.status(200).json({
      status: "success",
      message: "Projects fetched successfully",
      data: {
        projects,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "fail", message: error.message });
  }
};

export const getTasksByProject = async (req, res) => {
  try {
    const { projectId } = req.body;
    const project = await Projects.findOne({ projectId });
    if (!project)
      return res
        .status(404)
        .json({ status: "fail", message: "Project not found" });

    res.status(200).json({
      status: "success",
      message: "Tasks fetched successfully",
      data: {
        tasks: project.tasks,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "fail", message: error.message });
  }
};
