import { generateId } from "../common/common.js";
import { Projects } from "../Models/projectTaskModel.js";

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

    const projectId = await generateId(Projects, "PRJ", "projectId");

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
