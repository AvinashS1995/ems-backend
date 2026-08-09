import { Notification } from "../Models/NotificationModel.js";

const createNotification = async ({
  title,
  message,

  module,
  event,

  recipientEmployee,
  recipientEmail = "",

  createdByEmployee = null,
  createdByName = null,

  icon = "notifications",
  color = "#2196F3",

  route = null,

  referenceId = null,
  referenceType = null,

  metadata = {},

  expiresAt = null,
}) => {
  try {
    if (!recipientEmployee) {
      throw new Error("Recipient employee number is required.");
    }

    const notification = await Notification.create({
      title,

      message,

      module,

      event,

      recipientEmployee,

      recipientEmail,

      createdByEmployee,

      createdByName,

      icon,

      color,

      isRead: false,

      route,

      referenceId,

      referenceType,

      metadata,

      expiresAt,
    });

    return notification;
  } catch (error) {
    console.error("Create Notification Error:", error);

    throw error;
  }
};

const createBulkNotifications = async (recipients, notificationData) => {
  if (!recipients?.length) {
    return [];
  }

  const notifications = recipients.map((employee) => ({
    ...notificationData,

    recipientEmployee: employee.empNo,

    recipientEmail: employee.email || "",
  }));

  return await Notification.insertMany(notifications);
};

export { createNotification, createBulkNotifications };
