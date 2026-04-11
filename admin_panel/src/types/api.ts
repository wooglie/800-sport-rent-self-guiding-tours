import type { Tour } from "./tour";

// ---- Auth ----

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
};

export type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
};

// ---- Users ----

export type AdminUser = {
  id: string;
  email: string;
  createdBy: string;
  createdAt: string;
};

export type CreateUserRequest = {
  email: string;
  password: string;
};

// ---- Tokens ----

export type AccessToken = {
  code: string;
  label: string;
  durationHours: number;
  status: "active" | "expired" | "not_scanned";
  createdAt: string;
  firstScannedAt: string | null;
  expiresAt: string;
};

export type CreateTokenRequest = {
  label: string;
  durationHours: number;
};

export type CreateTokenResponse = {
  code: string;
  expiresAt: string;
  qrContent: string;
};

export type TokenStats = {
  activeToday: number;
  expired: number;
  total: number;
  notScanned: number;
};

// ---- Tours ----

export type CreateTourRequest = Omit<Tour, "id"> & { id: string };

export type UpdateTourRequest = Partial<Omit<Tour, "id">>;
