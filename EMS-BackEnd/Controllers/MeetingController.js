import { User } from "../Models/UserModel.js";
import { EmployeeUrlMeeting, Meeting } from "../Models/meetingModel.js";
import sendEmail from "../mail/sendMailforMeeting.js";
import { getPresignedUrl } from "../storage/s3.config.js";

const DEFAULT_AVATAR =
  "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";

const saveMeetingSchedule = async (req, res) => {
  try {
    const {
      title,
      date,
      startTime,
      endTime,
      meetingType,
      location,
      platform,
      description,
      attendees,
      empNo,
    } = req.body;

    let meetingLink = "";
    let finalLocation = location;

    const enhancedAttendees = await Promise.all(
      attendees.map(async (attendee) => {
        const user = await User.findOne({ empNo: attendee.empNo });
        if (user) {
          return {
            attendeesName: `${user.firstName} ${user.lastName} - ${user.empNo}`,
            email: user.email,
            empNo: user.empNo,
            avatar: "",
          };
        }
        return attendee;
      })
    );

    if (meetingType === "Online") {
      finalLocation = platform;

      const existingMeetingRecord = await EmployeeUrlMeeting.findOne({
        empNo,
        "platforms.platform": platform,
      });

      if (!existingMeetingRecord) {
        return res.status(404).json({
          status: "fail",
          message: `No meeting URL found for empNo: ${empNo} and platform: ${platform}`,
        });
      }

      const platformEntry = existingMeetingRecord.platforms.find(
        (p) => p.platform === platform
      );

      if (!platformEntry) {
        return res.status(404).json({
          status: "fail",
          message: `Platform URL not found for platform: ${platform}`,
        });
      }

      meetingLink = platformEntry.meetingUrl;
    }

    const newMeeting = new Meeting({
      title,
      date,
      startTime,
      endTime,
      meetingType,
      platform: meetingType === "Online" ? platform : null,
      location: finalLocation,
      meetingLink,
      description,
      attendees: enhancedAttendees,
      createdBy: empNo,
    });

    await newMeeting.save();

    for (const attendee of enhancedAttendees) {
      const isOnline = meetingType === "Online";
      const dateFormatted = new Date(date).toLocaleDateString("en-IN", {
        weekday: "long",
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

      const htmlContent = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 24px; background-color: #f9f9f9; border-radius: 10px; border: 1px solid #e0e0e0; max-width: 600px; margin: auto;">
          <div style="text-align: center; padding-bottom: 12px;">
            <h2 style="color: #2d3436; margin-bottom: 4px;">
              ${
                isOnline
                  ? "📱 Online Meeting Invitation"
                  : "🏢 Office Meeting Invitation"
              }
            </h2>
            <p style="margin: 0; color: #636e72; font-size: 14px;">Organized by EMS Scheduler</p>
          </div>

          <div style="background-color: #ffffff; padding: 20px; border-radius: 8px;">
            <p style="font-size: 15px;">Hi <strong>${
              attendee.attendeesName
            }</strong>,</p>
            <p style="margin-top: 4px;">You are invited to the following meeting:</p>

            <table style="width: 100%; margin-top: 16px; font-size: 14px; color: #2d3436;">
              <tr>
                <td style="padding: 8px 0;"><strong>📌 Title:</strong></td>
                <td>${title}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>🗓️ Date:</strong></td>
                <td>${dateFormatted}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>⏰ Time:</strong></td>
                <td>${startTime} - ${endTime}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>📍 Location:</strong></td>
                <td>${finalLocation}</td>
              </tr>
              ${
                isOnline
                  ? `<tr>
                    <td style="padding: 8px 0;"><strong>🔗 Join Link:</strong></td>
                    <td><a href="${meetingLink}" style="color: #0984e3;" target="_blank">Click to Join Meeting</a></td>
                  </tr>`
                  : ""
              }
            </table>

            <div style="margin-top: 20px;">
              <p style="font-size: 14px;"><strong>Description:</strong></p>
              <p style="margin: 6px 0; color: #636e72;">${description}</p>
            </div>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <p style="font-size: 13px; color: #b2bec3;">Please be on time. This is an auto-generated meeting invitation.</p>
            <p style="font-size: 13px; color: #636e72;">— EMS Scheduler System</p>
          </div>
        </div>
      `;

      await sendEmail({
        to: attendee.email,
        subject: `${
          isOnline ? "📱 Online Meeting" : "🏢 Offline Meeting"
        } Invitation: ${title}`,
        html: htmlContent,
      });
    }

    res.status(201).json({
      status: "success",
      message: "Meeting scheduled successfully",
      meeting: { newMeeting },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "fail",
      message: err.message,
    });
  }
};

const getAllMeetingSchedule = async (req, res) => {
  try {
    const { empNo, meetingType } = req.body;

    if (!empNo) {
      return res.status(400).json({
        status: "fail",
        message: "empNo is required",
      });
    }

    const query = { createdBy: empNo };

    if (meetingType) {
      query.meetingType = meetingType;
    }

    const meetings = await Meeting.find(query).sort({
      date: -1,
    });

    // Enrich attendee avatars
    const enrichedMeetings = await Promise.all(
      meetings.map(async (meeting) => {
        const enrichedAttendees = await Promise.all(
          meeting.attendees.map(async (attendee) => {
            const user = await User.findOne({ empNo: attendee.empNo });

            let avatar = DEFAULT_AVATAR;

            if (user?.profileImage) {
              try {
                avatar = await getPresignedUrl(user.profileImage);
              } catch (err) {
                console.warn(
                  `Failed to get presigned URL for ${attendee.empNo}`,
                  err.message
                );
              }
            }

            return {
              ...(attendee.toObject?.() || attendee),
              avatar,
            };
          })
        );

        return {
          ...meeting.toObject(),
          attendees: enrichedAttendees,
        };
      })
    );

    res.status(200).json({
      status: "success",
      message: "Meetings fetched successfully..!",
      data: { meetings: enrichedMeetings },
    });
  } catch (err) {
    console.error("Error in getAllMeetingSchedule:", err.message);
    res.status(500).json({
      status: "fail",
      message: err.message,
    });
  }
};

const deleteMeetingSchedule = async (req, res) => {
  try {
    const { id } = req.body;
    await Meeting.findByIdAndDelete(id);
    res.status(200).json({
      status: "success",
      message: "Meeting deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: err.message,
    });
  }
};

const updateMeetingSchedule = async (req, res) => {
  try {
    const {
      id,
      title,
      date,
      startTime,
      endTime,
      meetingType,
      location,
      platform,
      description,
      attendees,
    } = req.body;

    const updatedMeeting = await Meeting.findByIdAndUpdate(
      id,
      {
        title,
        date,
        startTime,
        endTime,
        meetingType,
        platform,
        location,
        description,
        attendees,
      },
      { new: true }
    );

    if (!updatedMeeting) {
      return res.status(404).json({
        status: "fail",
        message: "Meeting not found",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Meeting updated successfully",
      data: {
        updatedMeeting,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: err.message,
    });
  }
};

const saveOrUpdateEmployeeMeetingUrl = async (req, res) => {
  try {
    const { empNo, employeeName, email, platform, meetingUrl } = req.body;

    if (!empNo || !platform || !meetingUrl) {
      return res.status(400).json({
        status: "fail",
        message: "empNo, platform, and meetingUrl are required",
      });
    }

    let employee = await EmployeeUrlMeeting.findOne({ empNo });

    if (employee) {
      const existingPlatform = employee.platforms.find(
        (p) => p.platform === platform
      );

      if (existingPlatform) {
        existingPlatform.meetingUrl = meetingUrl;
      } else {
        employee.platforms.push({ platform, meetingUrl });
      }

      await employee.save();
    } else {
      employee = new EmployeeUrlMeeting({
        empNo,
        employeeName,
        email,
        platforms: [{ platform, meetingUrl }],
      });

      await employee.save();
    }

    return res.status(200).json({
      status: "success",
      message: "Meeting URL saved successfully",
      data: employee,
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

const getAllEmployeeMeetingUrls = async (req, res) => {
  try {
    const { empNo } = req.body;
    const data = await EmployeeUrlMeeting.find({ empNo });
    res.status(200).json({
      status: "success",
      message: "All employee meeting URLs fetched",
      data,
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: err.message,
    });
  }
};

export {
  saveMeetingSchedule,
  getAllMeetingSchedule,
  deleteMeetingSchedule,
  updateMeetingSchedule,
  saveOrUpdateEmployeeMeetingUrl,
  getAllEmployeeMeetingUrls,
};
