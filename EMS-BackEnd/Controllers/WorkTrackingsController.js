import { WorkTrackings } from "../Models/WorkTrackingsModel.js";

export const SaveWorkTrackings = async (req, res) => {
  try {
    const {
      empNo,
      date,
      projectName,
      moduleName,
      taskName,
      taskType,
      priority,
      jiraId,

      layer,
      frontendTech,
      backendTech,
      componentOrApi,
      apiIntegrated,

      status,
      estimatedHours,
      actualHours,
      startDate,
      endDate,
      blocker,

      repo,
      branch,
      baseBranch,
      prNo,
      reviewer,
      prStatus,
      mergeType,
      mergeDate,

      deployedTo,
      deploymentDate,
      deployedBy,
      releaseVersion,
      verifiedBy,

      prodIssue,
      prodIssueDesc,
      fixApplied,

      collaborationWith,
      communicationMode,
      remarks,
    } = req.body;

    // ✅ Mandatory validation
    if (!date || !projectName || !taskName) {
      return res.status(400).json({
        status: "fail",
        message: "Date, Project Name and Task Name are required",
      });
    }

    const newWorkTrackings = new WorkTrackings({
      empNo,
      date,

      projectName,
      moduleName,
      taskName,
      taskType,
      priority,
      jiraId,

      layer,
      frontendTech,
      backendTech,
      componentOrApi,
      apiIntegrated,

      status: status || "In Progress",
      estimatedHours,
      actualHours,
      startDate,
      endDate,
      blocker,

      repo,
      branch,
      baseBranch,
      prNo,
      reviewer,
      prStatus,
      mergeType,
      mergeDate,

      deployedTo,
      deploymentDate,
      deployedBy,
      releaseVersion,
      verifiedBy,

      prodIssue,
      prodIssueDesc,
      fixApplied,

      collaborationWith,
      communicationMode,
      remarks,
    });

    await newWorkTrackings.save();

    return res.status(201).json({
      status: "success",
      message: "Work entry saved successfully",
      data: newWorkTrackings,
    });
  } catch (error) {
    return res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

export const GetWorkTrackingKpis = async (req, res) => {
  try {
    const { empNo } = req.body; // 🔐 from JWT

    const works = await WorkTrackings.find({ empNo });

    const totalEntries = works.length;

    const inProgressCount = works.filter(
      (w) => w.status === "In Progress",
    ).length;

    const completedCount = works.filter((w) => w.status === "Completed").length;

    const totalHours = works.reduce((sum, w) => sum + (w.actualHours || 0), 0);

    return res.status(200).json({
      status: "success",
      data: {
        totalEntries,
        inProgressCount,
        completedCount,
        totalHours,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

export const GetWorkTrackings = async (req, res) => {
  try {
    const { empNo, fromDate, toDate, project, search } = req.body;

    const query = { empNo };

    if (fromDate && toDate) {
      query.date = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate),
      };
    }

    // 📌 Project filter
    if (project) {
      query.projectName = project;
    }

    // 🔍 Search filter
    if (search) {
      query.$or = [
        { taskName: { $regex: search, $options: "i" } },
        { moduleName: { $regex: search, $options: "i" } },
        { jiraId: { $regex: search, $options: "i" } },
      ];
    }

    const works = await WorkTrackings.find(query).sort({ date: -1 });

    return res.status(200).json({
      status: "success",
      data: works,
    });
  } catch (error) {
    return res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

export const UpdateWorkTrackings = async (req, res) => {
  try {
    const {
      id,
      date,
      projectName,
      moduleName,
      taskName,
      taskType,
      priority,
      jiraId,

      layer,
      frontendTech,
      backendTech,
      componentOrApi,
      apiIntegrated,

      status,
      estimatedHours,
      actualHours,
      startDate,
      endDate,
      blocker,

      repo,
      branch,
      baseBranch,
      prNo,
      reviewer,
      prStatus,
      mergeType,
      mergeDate,

      deployedTo,
      deploymentDate,
      deployedBy,
      releaseVersion,
      verifiedBy,

      prodIssue,
      prodIssueDesc,
      fixApplied,

      collaborationWith,
      communicationMode,
      remarks,
    } = req.body;

    // 🔐 Mandatory validation (same rules as save)
    if (!date || !projectName || !taskName) {
      return res.status(400).json({
        status: "fail",
        message: "Date, Project Name and Task Name are required",
      });
    }

    const updatedWork = await WorkTrackings.findByIdAndUpdate(
      id,
      {
        date,
        projectName,
        moduleName,
        taskName,
        taskType,
        priority,
        jiraId,

        layer,
        frontendTech,
        backendTech,
        componentOrApi,
        apiIntegrated,

        status,
        estimatedHours,
        actualHours,
        startDate,
        endDate,
        blocker,

        repo,
        branch,
        baseBranch,
        prNo,
        reviewer,
        prStatus,
        mergeType,
        mergeDate,

        deployedTo,
        deploymentDate,
        deployedBy,
        releaseVersion,
        verifiedBy,

        prodIssue,
        prodIssueDesc,
        fixApplied,

        collaborationWith,
        communicationMode,
        remarks,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedWork) {
      return res.status(404).json({
        status: "fail",
        message: "Work entry not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Work entry updated successfully",
      data: updatedWork,
    });
  } catch (error) {
    return res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

export const DeleteWorkTrackings = async (req, res) => {
  try {
    const { id } = req.body;

    const deletedWork = await WorkTrackings.findByIdAndDelete(id);

    if (!deletedWork) {
      return res.status(404).json({
        status: "fail",
        message: "Work entry not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Work entry deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};
