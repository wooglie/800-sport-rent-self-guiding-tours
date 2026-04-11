import jwt from "jsonwebtoken";

export type AdminAccessPayload = {
  userId: string;
  email: string;
  role: "admin";
  type: "admin_access";
};

export type AdminRefreshPayload = {
  userId: string;
  type: "admin_refresh";
};

export type TourPayload = {
  type: "tour";
};

function getEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing env var: ${key}`);
  return value;
}

export function signAdminAccess(payload: {
  userId: string;
  email: string;
}): string {
  const secret = getEnv("ADMIN_JWT_SECRET");
  const expiryMinutes = parseInt(
    process.env.ADMIN_JWT_EXPIRY_MINUTES ?? "15",
    10,
  );
  return jwt.sign({ ...payload, role: "admin", type: "admin_access" }, secret, {
    subject: payload.userId,
    expiresIn: expiryMinutes * 60,
  });
}

export function signAdminRefresh(payload: { userId: string }): string {
  const secret = getEnv("ADMIN_REFRESH_SECRET");
  const expiryDays = parseInt(
    process.env.ADMIN_REFRESH_EXPIRY_DAYS ?? "30",
    10,
  );
  return jwt.sign({ ...payload, type: "admin_refresh" }, secret, {
    subject: payload.userId,
    expiresIn: expiryDays * 24 * 60 * 60,
  });
}

export function signTourJwt(expiresAt: string): string {
  const secret = getEnv("TOUR_JWT_SECRET");
  const exp = Math.floor(Date.parse(expiresAt) / 1000);
  return jwt.sign({ type: "tour" }, secret, {
    expiresIn: exp - Math.floor(Date.now() / 1000),
  });
}

export function verifyAdminAccess(token: string): AdminAccessPayload | null {
  try {
    const secret = getEnv("ADMIN_JWT_SECRET");
    const payload = jwt.verify(token, secret) as AdminAccessPayload;
    if (payload.type !== "admin_access" || payload.role !== "admin")
      return null;
    return payload;
  } catch {
    return null;
  }
}

export function verifyAdminRefresh(token: string): AdminRefreshPayload | null {
  try {
    const secret = getEnv("ADMIN_REFRESH_SECRET");
    const payload = jwt.verify(token, secret) as AdminRefreshPayload;
    if (payload.type !== "admin_refresh") return null;
    return payload;
  } catch {
    return null;
  }
}

export function verifyTourJwt(token: string): TourPayload | null {
  try {
    const secret = getEnv("TOUR_JWT_SECRET");
    const payload = jwt.verify(token, secret) as TourPayload;
    if (payload.type !== "tour") return null;
    return payload;
  } catch {
    return null;
  }
}
