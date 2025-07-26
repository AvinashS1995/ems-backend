import mongoose from "mongoose";

const popupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Popup Name is Required Field!"],
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    startTime: {
      type: String,
    },
    endTime: {
      type: String,
    },
    country: {
      type: String,
      required: [true, "Country is Required Field!"],
    },
    role: {
      type: String,
      required: [true, "Role is Required Field!"],
    },
    gender: {
      type: String,
      required: [true, "Gender is Required Field!"],
    },
    employee: {
      type: String,
      required: [true, "Employee is Required Field!"],
    },
    popupType: {
      type: String,
      required: [true, "Popup Type is Required Field!"],
    },
    textMessage: {
      type: String,
    },
    uploadedFile: {
      type: String,
    },
    isActive: {
      type: Boolean,
    },
    createAt: {
      type: Date,
      default: Date.now,
    },
    updateAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    minimize: true,
  }
);

const Popup = mongoose.model("Popup", popupSchema);

export { Popup };
