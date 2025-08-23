import mongoose from "mongoose";

const money = { type: Number, required: true, min: 0, default: 0 };

const SalaryLineSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    amount: money,
  },
  { _id: false }
);

const PayslipSchema = new mongoose.Schema({
  employeeId: { type: String, required: true },
  email: { type: String, required: true },
  name: { type: String, required: true },
  designation: { type: String, required: true },
  department: { type: String, default: "" },
  bankName: { type: String, default: "" },
  bankAccount: { type: String, default: "" },
  pfNo: { type: String, default: "" },
  uan: { type: String, default: "" },
  pan: { type: String, default: "" },

  periodMonth: { type: Number, required: true }, // 1-12
  periodYear: { type: Number, required: true },
  payDate: { type: Date, required: true },

  paidDays: { type: Number, default: 0 },
  lopDays: { type: Number, default: 0 },

  earnings: [SalaryLineSchema],
  deductions: [SalaryLineSchema],

  grossEarnings: money,
  totalDeductions: money,
  netPay: money,

  // storage
  fileKey: { type: String },
  fileUrl: { type: String },

  // mail
  emailedAt: { type: Date },
  createAt: {
    type: Date,
    default: Date.now,
  },
  updateAt: {
    type: Date,
    default: Date.now,
  },
});

const Payslip = mongoose.model("Payslip", PayslipSchema);

export default Payslip;
