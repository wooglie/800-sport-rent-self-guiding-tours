export type AdminSession = {
  accessToken: string;
  refreshToken: string;
  accessExpiresAt: number; // unix timestamp (seconds)
  email: string;
};
