import { Notification } from "../Models/NotificationModel.js";

// ======================================================
// GET NOTIFICATIONS
// ======================================================

const getNotifications = async (req, res) => {
  try {
    const { empNo, page = 1, limit = 10, module, isRead } = req.body;

    // ------------------------------------------
    // Validation
    // ------------------------------------------

    if (!empNo) {
      return res.status(400).json({
        status: "fail",
        message: "Employee No is required.",
      });
    }

    const currentPage = Math.max(parseInt(page) || 1, 1);
    const pageLimit = Math.min(Math.max(parseInt(limit) || 10, 1), 100);

    const skip = (currentPage - 1) * pageLimit;

    // ------------------------------------------
    // Build Query
    // ------------------------------------------

    const query = {
      recipientEmployee: empNo,

      // Don't show expired notifications
      $or: [{ expiresAt: null }, { expiresAt: { $gte: new Date() } }],
    };

    // Module filter
    if (module) {
      query.module = module;
    }

    // Read / unread filter
    if (isRead !== undefined && isRead !== null) {
      query.isRead = isRead === true || isRead === "true";
    }

    // ------------------------------------------
    // Total Records
    // ------------------------------------------

    const totalRecords = await Notification.countDocuments(query);

    // ------------------------------------------
    // Notifications
    // ------------------------------------------

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageLimit)
      .lean();

    // ------------------------------------------
    // Unread Count
    // ------------------------------------------

    const unreadCount = await Notification.countDocuments({
      recipientEmployee: empNo,
      isRead: false,

      $or: [{ expiresAt: null }, { expiresAt: { $gte: new Date() } }],
    });

    // ------------------------------------------
    // Total Pages
    // ------------------------------------------

    const totalPages = Math.ceil(totalRecords / pageLimit);

    // ------------------------------------------
    // Response
    // ------------------------------------------

    return res.status(200).json({
      status: "success",
      message: "Notifications fetched successfully.",

      data: {
        notifications,

        unreadCount,

        pagination: {
          currentPage,
          limit: pageLimit,
          totalRecords,
          totalPages,

          hasNextPage: currentPage < totalPages,

          hasPreviousPage: currentPage > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get Notifications Error:", error);

    return res.status(500).json({
      status: "fail",
      message: "Failed to fetch notifications.",
      error: error.message,
    });
  }
};

// ======================================================
// GET UNREAD COUNT
// ======================================================

const getUnreadNotificationCount = async (req, res) => {
  try {
    const { empNo } = req.body;

    if (!empNo) {
      return res.status(400).json({
        status: "fail",
        message: "Employee No is required.",
      });
    }

    const unreadCount = await Notification.countDocuments({
      recipientEmployee: empNo,
      isRead: false,

      $or: [{ expiresAt: null }, { expiresAt: { $gte: new Date() } }],
    });

    return res.status(200).json({
      status: "success",
      message: "Unread notification count fetched successfully.",

      data: {
        unreadCount,
      },
    });
  } catch (error) {
    console.error("Get Unread Notification Count Error:", error);

    return res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

// ======================================================
// MARK SINGLE NOTIFICATION AS READ
// ======================================================

const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId, empNo } = req.body;

    if (!notificationId || !empNo) {
      return res.status(400).json({
        status: "fail",
        message: "notificationId and empNo are required.",
      });
    }

    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationId,

        // Important:
        // Employee can only update his own notification
        recipientEmployee: empNo,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      },
      {
        new: true,
      },
    );

    if (!notification) {
      return res.status(404).json({
        status: "fail",
        message: "Notification not found.",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Notification marked as read.",

      data: {
        notification,
      },
    });
  } catch (error) {
    console.error("Mark Notification Read Error:", error);

    return res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

// ======================================================
// MARK ALL NOTIFICATIONS AS READ
// ======================================================

const markAllNotificationsAsRead = async (req, res) => {
  try {
    const { empNo } = req.body;

    if (!empNo) {
      return res.status(400).json({
        status: "fail",
        message: "Employee No is required.",
      });
    }

    const result = await Notification.updateMany(
      {
        recipientEmployee: empNo,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      },
    );

    return res.status(200).json({
      status: "success",
      message: "All notifications marked as read.",

      data: {
        modifiedCount: result.modifiedCount,
      },
    });
  } catch (error) {
    console.error("Mark All Notifications Read Error:", error);

    return res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

export {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};
