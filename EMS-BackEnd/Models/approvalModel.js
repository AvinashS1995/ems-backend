import mongoose from "mongoose";

const approvalFlowSchema = new mongoose.Schema({
  type: { type: String, required: true },
  typeName: { type: String, required: true },
  listApprovalFlowDetails: [
    {
      role: String,
      sequenceNo: Number
    }
  ],
  createAt: {
        type: Date, default: Date.now
    },
    updateAt: {
        type: Date, default: Date.now
    }
});
const Approval = mongoose.model("ApprovalFlow", approvalFlowSchema);

export  { Approval };
