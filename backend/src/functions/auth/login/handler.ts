import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { query } from "../../../lib/dynamodb";
import { verifyPassword } from "../../../lib/password";
import { signAdminAccess, signAdminRefresh } from "../../../lib/jwt";
import {
  ok,
  unauthorized,
  badRequest,
  serverError,
} from "../../../lib/response";

interface UserRecord {
  userId: string;
  email: string;
  passwordHash: string;
}

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body ?? "{}");
    const { email, password } = body;

    if (!email || !password) {
      return badRequest("email and password are required");
    }

    const table = process.env.USERS_TABLE;
    if (!table) return serverError("USERS_TABLE not configured");

    const users = await query<UserRecord>({
      TableName: table,
      IndexName: "email-index",
      KeyConditionExpression: "email = :email",
      ExpressionAttributeValues: { ":email": email },
    });

    if (users.length === 0) {
      return unauthorized("Invalid credentials");
    }

    const user = users[0];
    const valid = await verifyPassword(password, user.passwordHash);

    if (!valid) {
      return unauthorized("Invalid credentials");
    }

    const accessToken = signAdminAccess({
      userId: user.userId,
      email: user.email,
    });
    const refreshToken = signAdminRefresh({ userId: user.userId });

    return ok({ accessToken, refreshToken });
  } catch (err) {
    console.error("login error", err);
    return serverError();
  }
};
