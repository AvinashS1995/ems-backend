import fs from "fs";
import path from "path";

export const imageToBase64 = (filePath) => {
  const absolutePath = path.resolve(filePath);
  const fileData = fs.readFileSync(absolutePath);
  const base64 = fileData.toString("base64");
  const mimeType =
    path.extname(filePath) === ".png" ? "image/png" : "image/jpeg";
  return `data:${mimeType};base64,${base64}`;
};
