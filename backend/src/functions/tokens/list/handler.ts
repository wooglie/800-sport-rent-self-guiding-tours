import { APIGatewayProxyResult } from "aws-lambda";
import { scan } from "../../../lib/dynamodb";
import { ok, serverError } from "../../../lib/response";

interface AccessToken {
  code: string;
  label: string;
  durationHours: number;
  expiresAt: string;
  createdAt: string;
  createdBy: string;
  firstScannedAt: string | null;
}

type TokenStatus = "active" | "expired" | "not_scanned";

function computeStatus(token: AccessToken): TokenStatus {
  if (token.firstScannedAt === null) return "not_scanned";
  if (new Date(token.expiresAt) > new Date()) return "active";
  return "expired";
}

export const handler = async (): Promise<APIGatewayProxyResult> => {
  try {
    const table = process.env.ACCESS_TOKENS_TABLE;
    if (!table) return serverError("ACCESS_TOKENS_TABLE not configured");

    const tokens = await scan<AccessToken>({ TableName: table });

    const withStatus = tokens
      .map((t) => ({ ...t, status: computeStatus(t) }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return ok(withStatus);
  } catch (err) {
    console.error("listTokens error", err);
    return serverError();
  }
};
