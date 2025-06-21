import mongoose from "mongoose";

const OtpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required field']
    },
    otp: {
        type: String,
        required: [true, 'Otp is Required Field']
    },
    createAt: {
        type: Date,
        default: Date.now
    },
    expiresAt: { 
        type: Date, 
        required: true 
    },  // Ensure it's "expiresAt" (not "expireAt")

})

// expired OTPs are automatically deleted after expiry
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OTP = mongoose.model("OTP", OtpSchema);

export default OTP;
