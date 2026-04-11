import { APIGatewayProxyResult } from "aws-lambda";
import { scan } from "../../../lib/dynamodb";
import { ok, serverError } from "../../../lib/response";

interface AccessToken {
  expiresAt: string;
  createdAt: string;
  firstScannedAt: string | null;
}

export const handler = async (): Promise<APIGatewayProxyResult> => {
  try {
    const table = process.env.ACCESS_TOKENS_TABLE;
    if (!table) return serverError("ACCESS_TOKENS_TABLE not configured");

    const tokens = await scan<AccessToken>({ TableName: table });

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    let total = 0;
    let activeToday = 0;
    let expired = 0;
    let notYetScanned = 0;

    for (const token of tokens) {
      total++;
      const expiresAt = new Date(token.expiresAt);
      const createdAt = new Date(token.createdAt);
      const isActive = expiresAt > now;

      if (isActive && createdAt >= startOfToday) {
        activeToday++;
      }
      if (!isActive) {
        expired++;
      }
      if (token.firstScannedAt === null && isActive) {
        notYetScanned++;
      }
    }

    return ok({ total, activeToday, expired, notYetScanned });
  } catch (err) {
    console.error("tokenStats error", err);
    return serverError();
  }
};
