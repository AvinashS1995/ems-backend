// ===================================================================
// 0. Correct Import for ua-parser-js  (IMPORTANT)
// ===================================================================
import { UAParser } from "ua-parser-js";

// ===================================================================
// 1. Extract Client Info
// ===================================================================
export const extractClientInfo = (req) => {
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.ip ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.info?.remoteAddress;

  const userAgent = req.headers["user-agent"];
  const parser = new UAParser(userAgent);
  const ua = parser.getResult();

  return {
    ip,
    userAgent,
    device: ua.device?.model || "Unknown Device",
    os: ua.os?.name || "Unknown OS",
    browser: ua.browser?.name || "Unknown Browser",
  };
};

// ===================================================================
// 2. Add Login History (location added later by saveLocation)
// ===================================================================
export const addLoginHistory = async (admin, clientInfo, sessionId) => {
  admin.loginHistory.push({
    ip: clientInfo.ip,
    userAgent: clientInfo.userAgent,
    device: clientInfo.device,
    os: clientInfo.os,
    browser: clientInfo.browser,
    sessionId: sessionId || null,
    loggedInAt: new Date(),

    // temporarily empty – filled after fetching location
    location: {},
  });

  admin.lastLoginIp = clientInfo.ip;
  admin.lastLoginAt = new Date();
};

// ===================================================================
// 3. Add An Activity Entry
// ===================================================================
export const addActivity = async (
  admin,
  action,
  description,
  clientInfo,
  status = "success"
) => {
  admin.activities.push({
    action,
    description,
    status,
    ip: clientInfo.ip,
    userAgent: clientInfo.userAgent,
    device: clientInfo.device,
    createdAt: new Date(),
  });
};

// ===================================================================
// 4. Attach Location to LAST Login History Entry
// ===================================================================
export const saveLocation = async (admin, locationInfo) => {
  const lastLogin = admin.loginHistory[admin.loginHistory.length - 1];

  if (!lastLogin) return;

  lastLogin.location = {
    ip: locationInfo.ip,
    country: locationInfo.country,
    region: locationInfo.region,
    city: locationInfo.city,
    lat: locationInfo.lat,
    lng: locationInfo.lng,
    timezone: locationInfo.timezone,
  };

  await admin.save();
};

// ===================================================================
// 5. Fetch Location Data from ipapi.co
// ===================================================================
export const fetchLocation = async (ip) => {
  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    const data = await response.json();

    return {
      ip,
      country: data.country_name || "Unknown",
      region: data.region || "Unknown",
      city: data.city || "Unknown",
      lat: data.latitude || null,
      lng: data.longitude || null,
      timezone: data.timezone || "Unknown",
    };
  } catch (err) {
    console.error("Location Fetch Error:", err);
    return {
      ip,
      country: "Unknown",
      region: "Unknown",
      city: "Unknown",
      lat: null,
      lng: null,
      timezone: "Unknown",
    };
  }
};
