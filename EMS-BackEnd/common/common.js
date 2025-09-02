import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_SECRET_KEY, "hex");
const IV_LENGTH = 16;

export function generateRandomKey() {
  return crypto.randomBytes(32).toString("hex");
}

export function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");
  return iv.toString("hex") + ":" + encrypted;
}

export function decrypt(text) {
  const [ivHex, encryptedData] = text.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export async function generateId(model, prefix, idField) {
  const lastDoc = await model
    .findOne({}, { [idField]: 1 })
    .sort({ createdAt: -1 })
    .lean();

  if (!lastDoc || !lastDoc[idField]) {
    return `${prefix}001`;
  }

  const lastNumber = parseInt(lastDoc[idField].replace(prefix, ""), 10);
  const newNumber = lastNumber + 1;
  return `${prefix}${String(newNumber).padStart(3, "0")}`;
}
