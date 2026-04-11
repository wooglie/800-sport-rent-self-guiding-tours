import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { randomBytes } from "crypto";
import { getItem, putItem } from "../../../lib/dynamodb";
import { created, badRequest, serverError } from "../../../lib/response";

function generateCode(): string {
  return randomBytes(6).toString("base64url").slice(0, 8);
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const createdBy = event.requestContext.authorizer?.userId as string | undefined;

    const body = JSON.parse(event.body ?? "{}");
    const { label, durationHours } = body;

    if (!label || typeof label !== "string" || label.trim().length === 0) {
      return badRequest("label is required");
    }
    if (!durationHours || typeof durationHours !== "number" || durationHours <= 0) {
      return badRequest("durationHours must be a positive number");
    }

    const table = process.env.ACCESS_TOKENS_TABLE;
    if (!table) return serverError("ACCESS_TOKENS_TABLE not configured");

    const tourAppUrl = process.env.TOUR_APP_URL ?? "https://app.sport-rent.800.hr";

    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationHours * 60 * 60 * 1000).toISOString();
    const expiresAtEpoch = Math.floor(Date.parse(expiresAt) / 1000);

    let code: string | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const candidate = generateCode();
      const existing = await getItem({ TableName: table, Key: { code: candidate } });
      if (!existing) {
        code = candidate;
        break;
      }
    }

    if (!code) {
      return serverError("Failed to generate unique code");
    }

    await putItem({
      TableName: table,
      Item: {
        code,
        label: label.trim(),
        durationHours,
        expiresAt,
        expiresAtEpoch,
        createdAt: now.toISOString(),
        createdBy: createdBy ?? "unknown",
        firstScannedAt: null,
      },
    });

    const qrContent = `${tourAppUrl}/auth?token=${code}`;

    return created({ code, label: label.trim(), expiresAt, qrContent });
  } catch (err) {
    console.error("createToken error", err);
    return serverError();
  }
};
