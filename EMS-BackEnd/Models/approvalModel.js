import mongoose from "mongoose";

const approvalFlowSchema = new mongoose.Schema({
  type: { type: String, required: true },
  typeName: { type: String, required: true },
  displayName: { type: String },
  listApprovalFlowDetails: [
    {
      role: String,
      sequenceNo: Number,
    },
  ],
  createAt: {
    type: Date,
    default: Date.now,
  },
  updateAt: {
    type: Date,
    default: Date.now,
  },
});
const ApprovalFlow = mongoose.model("ApprovalFlow", approvalFlowSchema);

export { ApprovalFlow };
