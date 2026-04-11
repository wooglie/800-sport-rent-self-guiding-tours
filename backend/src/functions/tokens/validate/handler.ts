import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getItem, updateItem } from "../../../lib/dynamodb";
import { signTourJwt } from "../../../lib/jwt";
import { ok, badRequest, serverError } from "../../../lib/response";

interface AccessToken {
  code: string;
  label: string;
  expiresAt: string;
  firstScannedAt: string | null;
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body ?? "{}");
    const { code } = body;

    if (!code || typeof code !== "string") {
      return badRequest("code is required");
    }

    const table = process.env.ACCESS_TOKENS_TABLE;
    if (!table) return serverError("ACCESS_TOKENS_TABLE not configured");

    const token = await getItem<AccessToken>({
      TableName: table,
      Key: { code },
    });

    if (!token) {
      return ok({ valid: false, reason: "not_found" });
    }

    if (new Date(token.expiresAt) <= new Date()) {
      return ok({ valid: false, reason: "expired" });
    }

    if (token.firstScannedAt === null) {
      await updateItem({
        TableName: table,
        Key: { code },
        UpdateExpression: "SET firstScannedAt = :now",
        ExpressionAttributeValues: { ":now": new Date().toISOString() },
      });
    }

    const jwt = signTourJwt(token.expiresAt);

    return ok({ valid: true, jwt, expiresAt: token.expiresAt });
  } catch (err) {
    console.error("validateToken error", err);
    return serverError();
  }
};
