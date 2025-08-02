import mongoose from "mongoose";

const AttendeeSchema = new mongoose.Schema({
  attendeesName: String,
  email: String,
  avatar: String,
  empNo: String,
});

const MeetingSchema = new mongoose.Schema({
  title: String,
  date: Date,
  startTime: String,
  endTime: String,
  meetingType: { type: String, required: true },
  platform: String,
  location: String,
  meetingLink: String,
  description: String,
  attendees: [AttendeeSchema],
  createdBy: String,
  createAt: {
    type: Date,
    default: Date.now,
  },
  updateAt: {
    type: Date,
    default: Date.now,
  },
});

const Meeting = mongoose.model("Meeting", MeetingSchema);

const PlatformUrlSchema = new mongoose.Schema({
  platform: {
    type: String,
    required: true,
  },
  meetingUrl: { type: String, required: true },
});

const EmployeeUrlMeetingSchema = new mongoose.Schema({
  empNo: { type: String, required: true, unique: true },
  employeeName: { type: String, required: true },
  email: { type: String, required: true },
  platforms: [PlatformUrlSchema],
  createAt: {
    type: Date,
    default: Date.now,
  },
  updateAt: {
    type: Date,
    default: Date.now,
  },
});

const EmployeeUrlMeeting = mongoose.model(
  "EmployeeUrlMeeting",
  EmployeeUrlMeetingSchema
);

export { Meeting, EmployeeUrlMeeting };
