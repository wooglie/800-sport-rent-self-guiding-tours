import type { Tour } from "@/types/tour";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type ValidateTokenResponse =
  | { valid: true; jwt: string; expiresAt: string }
  | { valid: false; reason: "not_found" | "expired" };

export async function validateToken(code: string): Promise<ValidateTokenResponse> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/tokens/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
  } catch {
    throw "network_error";
  }
  if (res.status >= 500) throw "server_error";
  return res.json() as Promise<ValidateTokenResponse>;
}

export async function fetchTours(jwt: string): Promise<Tour[]> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/tours`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
  } catch {
    throw "network_error";
  }
  if (res.status >= 500) throw "server_error";
  return res.json() as Promise<Tour[]>;
}
