import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

// Resend Instance तयार करा
const resend = new Resend(process.env.RESEND_API_KEY);

export default resend;
