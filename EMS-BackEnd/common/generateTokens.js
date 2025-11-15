import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

// Token lifetimes
const ACCESS_TOKEN_EXPIRES_IN = "15m";
const REFRESH_TOKEN_EXPIRES_IN = "7d";

/**
 * Generates a short-lived access token and a long-lived refresh token.
 * @param {Object} admin - The admin object
 * @returns {Object} - Contains both tokens
 */
export const generateTokens = (admin) => {
  const payload = {
    id: admin._id,
    role: admin.role,
    fullName: admin.fullName,
    email: admin.email,
  };

  const accessToken = jwt.sign(payload, JWT_SECRET_KEY, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });

  const refreshToken = jwt.sign({ payload }, JWT_SECRET_KEY, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });

  return { accessToken, refreshToken };
};
