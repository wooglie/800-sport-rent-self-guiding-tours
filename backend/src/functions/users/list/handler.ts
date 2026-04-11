import { APIGatewayProxyResult } from "aws-lambda";
import { scan } from "../../../lib/dynamodb";
import { ok, serverError } from "../../../lib/response";

interface UserRecord {
  userId: string;
  email: string;
  role: string;
  createdAt: string;
  createdBy: string;
  passwordHash?: string;
}

export const handler = async (): Promise<APIGatewayProxyResult> => {
  try {
    const table = process.env.USERS_TABLE;
    if (!table) return serverError("USERS_TABLE not configured");

    const users = await scan<UserRecord>({ TableName: table });

    const sanitized = users.map(({ passwordHash: _ph, ...user }) => user);

    return ok(sanitized);
  } catch (err) {
    console.error("listUsers error", err);
    return serverError();
  }
};
