import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getItem } from "../../../lib/dynamodb";
import { verifyAdminRefresh, signAdminAccess } from "../../../lib/jwt";
import {
  ok,
  unauthorized,
  badRequest,
  serverError,
} from "../../../lib/response";

interface UserRecord {
  userId: string;
  email: string;
}

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body ?? "{}");
    const { refreshToken } = body;

    if (!refreshToken) {
      return badRequest("refreshToken is required");
    }

    const payload = verifyAdminRefresh(refreshToken);
    if (!payload) {
      return unauthorized("Invalid or expired refresh token");
    }

    const table = process.env.USERS_TABLE;
    if (!table) return serverError("USERS_TABLE not configured");

    const user = await getItem<UserRecord>({
      TableName: table,
      Key: { userId: payload.userId },
    });

    if (!user) {
      return unauthorized("User no longer exists");
    }

    const accessToken = signAdminAccess({
      userId: user.userId,
      email: user.email,
    });

    return ok({ accessToken });
  } catch (err) {
    console.error("refresh error", err);
    return serverError();
  }
};
