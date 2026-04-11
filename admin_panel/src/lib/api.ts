import {
  getSession,
  saveSession,
  clearSession,
  isAccessTokenExpiringSoon,
} from "./session";
import type {
  LoginRequest,
  LoginResponse,
  RefreshResponse,
  AdminUser,
  CreateUserRequest,
  AccessToken,
  CreateTokenRequest,
  CreateTokenResponse,
  TokenStats,
  CreateTourRequest,
  UpdateTourRequest,
} from "@/types/api";
import type { Tour } from "@/types/tour";
import type { AdminSession } from "@/types/session";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.sport-rent.800.hr";

// ---- JWT decode (no verify, just read payload) ----

function decodeJwtExpiry(token: string): number {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp as number;
  } catch {
    return 0;
  }
}

// ---- Core fetch wrapper ----

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  let session = getSession();

  // Proactively refresh if token is expiring soon
  if (session && isAccessTokenExpiringSoon(session)) {
    session = await doRefresh(session.refreshToken);
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (session) {
    headers["Authorization"] = `Bearer ${session.accessToken}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401 && retry) {
    // Try to refresh and retry once
    const current = getSession();
    if (current) {
      try {
        await doRefresh(current.refreshToken);
        return apiFetch<T>(path, options, false);
      } catch {
        clearSession();
        window.location.href = "/login";
        throw new Error("Session expired");
      }
    } else {
      clearSession();
      window.location.href = "/login";
      throw new Error("No session");
    }
  }

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(text || `HTTP ${res.status}`);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

// ---- Auth refresh (used internally + exported) ----

async function doRefresh(refreshToken: string): Promise<AdminSession> {
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) throw new Error("Refresh failed");

  const data: RefreshResponse = await res.json();
  const session: AdminSession = {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    accessExpiresAt: decodeJwtExpiry(data.accessToken),
    email: getSession()?.email ?? "",
  };
  saveSession(session);
  return session;
}

// ---- Auth ----

export async function login(
  email: string,
  password: string,
): Promise<AdminSession> {
  const body: LoginRequest = { email, password };
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(text || `HTTP ${res.status}`);
  }

  const data: LoginResponse = await res.json();
  const session: AdminSession = {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    accessExpiresAt: decodeJwtExpiry(data.accessToken),
    email,
  };
  saveSession(session);
  return session;
}

export async function refresh(refreshToken: string): Promise<AdminSession> {
  return doRefresh(refreshToken);
}

export async function logout(): Promise<void> {
  await apiFetch("/auth/logout", { method: "POST" }).catch(() => {});
  clearSession();
}

// ---- Users ----

export async function listUsers(): Promise<AdminUser[]> {
  return apiFetch<AdminUser[]>("/users");
}

export async function createUser(
  email: string,
  password: string,
): Promise<AdminUser> {
  const body: CreateUserRequest = { email, password };
  return apiFetch<AdminUser>("/users", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// ---- Tokens ----

export async function listTokens(): Promise<AccessToken[]> {
  return apiFetch<AccessToken[]>("/tokens");
}

export async function createToken(
  label: string,
  durationHours: number,
): Promise<CreateTokenResponse> {
  const body: CreateTokenRequest = { label, durationHours };
  return apiFetch<CreateTokenResponse>("/tokens", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getTokenStats(): Promise<TokenStats> {
  return apiFetch<TokenStats>("/tokens/stats");
}

// ---- Tours ----

export async function listTours(): Promise<Tour[]> {
  return apiFetch<Tour[]>("/admin/tours");
}

export async function createTour(tour: CreateTourRequest): Promise<Tour> {
  return apiFetch<Tour>("/admin/tours", {
    method: "POST",
    body: JSON.stringify(tour),
  });
}

export async function updateTour(
  id: string,
  tour: UpdateTourRequest,
): Promise<Tour> {
  return apiFetch<Tour>(`/admin/tours/${id}`, {
    method: "PUT",
    body: JSON.stringify(tour),
  });
}

export async function deleteTour(id: string): Promise<void> {
  return apiFetch<void>(`/admin/tours/${id}`, { method: "DELETE" });
}
