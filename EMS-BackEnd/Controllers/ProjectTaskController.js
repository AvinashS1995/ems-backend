import { generateId, generateTaskId } from "../common/common.js";
import { getApprovalStepManagetToEmployees } from "../common/employee.utilis.js";
import { NOTIFICATION_EVENTS } from "../common/notificationConstant.js";
import { createNotification } from "../common/NotificationService.js";
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
      creator.role,
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

    // ========================================
    // PROJECT CREATED / APPROVAL NOTIFICATION
    // ========================================

    try {
      const firstPendingApprover = approvalStatus.find(
        (step) => step.status === "Pending",
      );

      if (firstPendingApprover?.empNo) {
        await createNotification({
          title: "Project Assignment Approval Required",

          message: `${creator.firstName} ${creator.lastName} submitted project "${title}" for your approval.`,

          module: "Project",

          event: NOTIFICATION_EVENTS.PROJECT_APPROVAL_PENDING,

          recipientEmployee: firstPendingApprover.empNo,

          recipientEmail: (
            await User.findOne({ empNo: firstPendingApprover.empNo })
          )?.email,

          createdByEmployee: creator.empNo,

          createdByName: `${creator.firstName} ${creator.lastName}`,

          icon: "assignment",

          color: "#2196F3",

          route: "/project-task",

          referenceId: newProject._id.toString(),

          referenceType: "Project",

          metadata: {
            projectId,
            projectTitle: title,
            priority,
            deadline,
            createdBy: creator.empNo,
            assignedTo: assignTo.empNo,
            approvalRole: firstPendingApprover.role,
          },
        });
      }
    } catch (notificationError) {
      console.error(
        "❌ Project notification failed:",
        notificationError.message,
      );
    }

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
        step.status !== "Pending",
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
        ),
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
      approver.role,
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

    // ========================================
    // PROJECT APPROVAL NOTIFICATION
    // ========================================

    try {
      const creatorUser = await User.findOne({
        empNo: project.createdBy.empNo,
      });

      // ----------------------------------------
      // REJECTED
      // ----------------------------------------

      if (action === "Rejected") {
        if (creatorUser) {
          await createNotification({
            title: "Project Rejected",

            message: `Your project "${project.title}" was rejected by ${approver.firstName} ${approver.lastName}.`,

            module: "Project",

            event: NOTIFICATION_EVENTS.PROJECT_REJECTED,

            recipientEmployee: creatorUser.empNo,

            recipientEmail: creatorUser.email,

            createdByEmployee: approver.empNo,

            createdByName: `${approver.firstName} ${approver.lastName}`,

            icon: "cancel",

            color: "#F44336",

            route: "/project-task",

            referenceId: project._id.toString(),

            referenceType: "Project",

            metadata: {
              projectId: project.projectId,
              projectTitle: project.title,
              rejectedBy: approver.empNo,
              rejectedByRole: role,
              comments,
            },
          });
        }
      }

      // ----------------------------------------
      // FULLY APPROVED
      // ----------------------------------------
      else if (!nextPending) {
        if (creatorUser) {
          await createNotification({
            title: "Project Approved",

            message: `Your project "${project.title}" has been approved successfully.`,

            module: "Project",

            event: NOTIFICATION_EVENTS.PROJECT_APPROVED,

            recipientEmployee: creatorUser.empNo,

            recipientEmail: creatorUser.email,

            createdByEmployee: approver.empNo,

            createdByName: `${approver.firstName} ${approver.lastName}`,

            icon: "check_circle",

            color: "#4CAF50",

            route: "/project-task",

            referenceId: project._id.toString(),

            referenceType: "Project",

            metadata: {
              projectId: project.projectId,
              projectTitle: project.title,
              approvedBy: approver.empNo,
            },
          });
        }
      }

      // ----------------------------------------
      // NEXT APPROVER
      // ----------------------------------------
      else {
        const nextApprover = await User.findOne({
          empNo: nextPending.empNo,
        });

        if (nextApprover) {
          await createNotification({
            title: "Project Approval Required",

            message: `Project "${project.title}" is waiting for your approval.`,

            module: "Project",

            event: NOTIFICATION_EVENTS.PROJECT_APPROVAL_PENDING,

            recipientEmployee: nextApprover.empNo,

            recipientEmail: nextApprover.email,

            createdByEmployee: approver.empNo,

            createdByName: `${approver.firstName} ${approver.lastName}`,

            icon: "approval",

            color: "#FF9800",

            route: "/project-task",

            referenceId: project._id.toString(),

            referenceType: "Project",

            metadata: {
              projectId: project.projectId,
              projectTitle: project.title,
              approvalRole: nextPending.role,
            },
          });
        }
      }
    } catch (notificationError) {
      console.error(
        "❌ Project approval notification failed:",
        notificationError.message,
      );
    }

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
    } = req.body;

    if (
      !projectId ||
      !title ||
      !deadline ||
      !assignTo?.empNo ||
      !createdBy?.empNo
    ) {
      return res.status(400).json({
        status: "fail",
        message:
          "projectId, title, deadline, assignTo.empNo, createdBy.empNo are required",
      });
    }

    const project = await Projects.findOne({ projectId });
    if (!project) {
      return res.status(404).json({
        status: "fail",
        message: "Project not found",
      });
    }

    const creator = await User.findOne({ empNo: createdBy.empNo });

    // const taskId = await generateId(Projects, "TSK", "tasks.taskId");
    const taskId = await generateTaskId();

    // 3. Fetch Approval flow (Project Assign Request)
    const approvalFlow = await ApprovalFlow.findOne({
      typeName: "Projects",
      displayName: "Task Assign Request",
    });
    console.log(approvalFlow);
    if (!approvalFlow) {
      return res.status(404).json({
        status: "fail",
        message: "Approval flow not found for Task Assign Request",
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
      creator.role,
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
      approvalFlowId: approvalFlow._id,
      approvalStatus,
      type: approvalFlow.type,
      createAt: new Date(),
    };

    project.tasks.push(newTask);
    project.updateAt = new Date();

    await project.save();

    // ========================================
    // TASK CREATED NOTIFICATION
    // ========================================

    try {
      const firstPendingApprover = approvalStatus.find(
        (step) => step.status === "Pending",
      );

      // ----------------------------------------
      // APPROVAL REQUIRED
      // ----------------------------------------

      if (firstPendingApprover?.empNo) {
        const approverUser = await User.findOne({
          empNo: firstPendingApprover.empNo,
        });

        if (approverUser) {
          await createNotification({
            title: "Task Approval Required",

            message: `${creator.firstName} ${creator.lastName} created task "${title}" and assigned it for your approval.`,

            module: "Task",

            event: NOTIFICATION_EVENTS.TASK_APPROVAL_PENDING,

            recipientEmployee: approverUser.empNo,

            recipientEmail: approverUser.email,

            createdByEmployee: creator.empNo,

            createdByName: `${creator.firstName} ${creator.lastName}`,

            icon: "task",

            color: "#2196F3",

            route: "/project-task",

            referenceId: taskId,

            referenceType: "Task",

            metadata: {
              taskId,

              projectId,

              taskTitle: title,

              priority,

              deadline,

              assignedTo: assignTo.empNo,

              approvalRole: firstPendingApprover.role,
            },
          });
        }
      }

      // ----------------------------------------
      // DIRECTLY APPROVED
      // ----------------------------------------
      else {
        const assignedEmployee = await User.findOne({
          empNo: assignTo.empNo,
        });

        if (assignedEmployee) {
          await createNotification({
            title: "New Task Assigned",

            message: `You have been assigned a new task "${title}".`,

            module: "Task",

            event: NOTIFICATION_EVENTS.TASK_ASSIGNED,

            recipientEmployee: assignedEmployee.empNo,

            recipientEmail: assignedEmployee.email,

            createdByEmployee: creator.empNo,

            createdByName: `${creator.firstName} ${creator.lastName}`,

            icon: "assignment_ind",

            color: "#4CAF50",

            route: "/project-task",

            referenceId: taskId,

            referenceType: "Task",

            metadata: {
              taskId,

              projectId,

              taskTitle: title,

              priority,

              deadline,
            },
          });
        }
      }
    } catch (notificationError) {
      console.error("❌ Task notification failed:", notificationError.message);
    }

    res.status(201).json({
      status: "success",
      message: "Task created successfully",
      data: { taskId, task: newTask },
    });
  } catch (error) {
    console.error("Error in createTask:", error);
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

    // ========================================
    // TASK STATUS NOTIFICATION
    // ========================================

    try {
      const employee = await User.findOne({
        empNo: task.assignTo.empNo,
      });

      const creator = await User.findOne({
        empNo: task.createdBy.empNo,
      });

      // Notify task creator
      if (creator && creator.empNo !== updatedBy?.empNo) {
        await createNotification({
          title: "Task Status Updated",

          message: `Task "${task.title}" status changed to "${status}".`,

          module: "Task",

          event: NOTIFICATION_EVENTS.TASK_STATUS_UPDATED,

          recipientEmployee: creator.empNo,

          recipientEmail: creator.email,

          createdByEmployee: employee?.empNo || updatedBy?.empNo,

          createdByName: employee
            ? `${employee.firstName} ${employee.lastName}`
            : "Employee",

          icon: status === "Completed" ? "task_alt" : "update",

          color: status === "Completed" ? "#4CAF50" : "#2196F3",

          route: "/project-task",

          referenceId: task.taskId,

          referenceType: "Task",

          metadata: {
            taskId: task.taskId,

            projectId: project.projectId,

            taskTitle: task.title,

            status,
          },
        });
      }
    } catch (notificationError) {
      console.error(
        "❌ Task status notification failed:",
        notificationError.message,
      );
    }

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
    const { empNo } = req.body;

    if (!empNo) {
      return res.status(400).json({
        status: "fail",
        message: "empNo is required",
      });
    }

    // Find projects that have tasks with this empNo pending
    const projects = await Projects.find({
      "tasks.approvalStatus": {
        $elemMatch: { empNo: empNo, status: "Pending" },
      },
    }).lean();

    // Collect only relevant tasks
    let tasks = [];
    projects.forEach((project) => {
      (project.tasks || []).forEach((task) => {
        const hasPending = task.approvalStatus.some(
          (s) => s.empNo === empNo && s.status === "Pending",
        );
        if (hasPending) {
          tasks.push({
            ...task,
            projectId: project.projectId,
            projectName: project.projectName, // optional if you want context
          });
        }
      });
    });

    res.status(200).json({
      status: "success",
      message: "Tasks fetched successfully",
      data: { tasks },
    });
  } catch (error) {
    console.error("Error in getTasksByProjects:", error);
    res.status(500).json({ status: "fail", message: error.message });
  }
};

export const approveRejectTask = async (req, res) => {
  try {
    const { projectId, taskId, action, comments, approverEmpNo } = req.body;

    // 🔹 Find project
    const project = await Projects.findOne({ projectId });
    if (!project) {
      return res
        .status(404)
        .json({ status: "fail", message: "Project not found" });
    }

    // 🔹 Find task inside project
    const task = project.tasks.find((t) => t.taskId === taskId);
    console.log(task);
    if (!task) {
      return res
        .status(404)
        .json({ status: "fail", message: "Task not found" });
    }

    // 🔹 Find approver
    const approver = await User.findOne({ empNo: approverEmpNo });
    if (!approver) {
      return res
        .status(404)
        .json({ status: "fail", message: "Approver not found" });
    }

    const role = approver.role;

    // ✅ Only check current task approvalStatus for a pending step
    const pendingStep = task.approvalStatus.find(
      (step) =>
        step.empNo === approverEmpNo &&
        step.role === role &&
        step.status === "Pending",
    );

    console.log(pendingStep);

    if (!pendingStep) {
      return res.status(400).json({
        status: "fail",
        message: "You are not allowed to act on this task",
      });
    }

    // 🔹 Update that pending step
    pendingStep.status = action === "Approved" ? "Approved" : "Rejected";
    pendingStep.comments = comments;
    pendingStep.actionDate = new Date();

    // 🔹 Check approval flow for next step
    const approvalFlow = await ApprovalFlow.findById(task.approvalFlowId);
    const flowSteps = approvalFlow?.listApprovalFlowDetails || [];

    const stepperData = await getApprovalStepManagetToEmployees(
      task.createdBy.empNo,
      flowSteps,
      task.approvalStatus,
      approver.role,
    );

    const nextPending = stepperData.find((step) => step.status === "Pending");

    if (action === "Rejected") {
      task.status = `Rejected by ${role}`;
    } else if (!nextPending) {
      task.status = "Approved";
    } else {
      task.status = `Pending for ${nextPending.role}`;
      task.approvalStatus.push({
        role: nextPending.role,
        empNo: nextPending.empNo,
        name: nextPending.name.split(" - ")[0],
        status: "Pending",
        comments: null,
        actionDate: null,
      });
    }

    const approverBy = {
      empNo: approverEmpNo,
      role: approver.role,
      name: `${approver.firstName} ${approver.lastName}`,
    };

    // 🔹 Update audit fields
    task.updatedBy = approverBy;
    task.updateAt = new Date();
    project.updateAt = new Date();

    await project.save();

    // ========================================
    // TASK APPROVAL NOTIFICATION
    // ========================================

    try {
      const taskCreator = await User.findOne({
        empNo: task.createdBy.empNo,
      });

      // ----------------------------------------
      // TASK REJECTED
      // ----------------------------------------

      if (action === "Rejected") {
        if (taskCreator) {
          await createNotification({
            title: "Task Rejected",

            message: `Your task "${task.title}" was rejected by ${approver.firstName} ${approver.lastName}.`,

            module: "Task",

            event: NOTIFICATION_EVENTS.TASK_REJECTED,

            recipientEmployee: taskCreator.empNo,

            recipientEmail: taskCreator.email,

            createdByEmployee: approver.empNo,

            createdByName: `${approver.firstName} ${approver.lastName}`,

            icon: "cancel",

            color: "#F44336",

            route: "/project-task",

            referenceId: task.taskId,

            referenceType: "Task",

            metadata: {
              taskId: task.taskId,

              projectId: project.projectId,

              taskTitle: task.title,

              rejectedBy: approver.empNo,

              rejectedByRole: role,

              comments,
            },
          });
        }
      }

      // ----------------------------------------
      // TASK FULLY APPROVED
      // ----------------------------------------
      else if (!nextPending) {
        const assignedEmployee = await User.findOne({
          empNo: task.assignTo.empNo,
        });

        if (assignedEmployee) {
          await createNotification({
            title: "Task Assigned",

            message: `Your task "${task.title}" has been approved and assigned to you.`,

            module: "Task",

            event: NOTIFICATION_EVENTS.TASK_APPROVED,

            recipientEmployee: assignedEmployee.empNo,

            recipientEmail: assignedEmployee.email,

            createdByEmployee: approver.empNo,

            createdByName: `${approver.firstName} ${approver.lastName}`,

            icon: "task_alt",

            color: "#4CAF50",

            route: "/project-task",

            referenceId: task.taskId,

            referenceType: "Task",

            metadata: {
              taskId: task.taskId,

              projectId: project.projectId,

              taskTitle: task.title,

              priority: task.priority,

              deadline: task.deadline,
            },
          });
        }
      }

      // ----------------------------------------
      // NEXT APPROVER
      // ----------------------------------------
      else {
        const nextApprover = await User.findOne({
          empNo: nextPending.empNo,
        });

        if (nextApprover) {
          await createNotification({
            title: "Task Approval Required",

            message: `Task "${task.title}" is waiting for your approval.`,

            module: "Task",

            event: TASK_APPROVAL_PENDING,

            recipientEmployee: nextApprover.empNo,

            recipientEmail: nextApprover.email,

            createdByEmployee: approver.empNo,

            createdByName: `${approver.firstName} ${approver.lastName}`,

            icon: "approval",

            color: "#FF9800",

            route: "/project-task",

            referenceId: task.taskId,

            referenceType: "Task",

            metadata: {
              taskId: task.taskId,

              projectId: project.projectId,

              taskTitle: task.title,

              approvalRole: nextPending.role,
            },
          });
        }
      }
    } catch (notificationError) {
      console.error(
        "❌ Task approval notification failed:",
        notificationError.message,
      );
    }

    res.status(200).json({
      status: "success",
      message: `Task ${action}ed successfully`,
      data: task,
    });
  } catch (error) {
    console.error("Error in approveRejectTask:", error);
    res.status(500).json({ status: "fail", message: error.message });
  }
};
