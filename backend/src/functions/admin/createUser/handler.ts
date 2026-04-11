import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { v4 as uuidv4 } from "uuid";
import { query, putItem } from "../../../lib/dynamodb";
import { hashPassword } from "../../../lib/password";
import {
  created,
  badRequest,
  forbidden,
  conflict,
  serverError,
} from "../../../lib/response";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    const apiKey = event.headers["x-api-key"] ?? event.headers["X-Api-Key"];
    if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
      return forbidden();
    }

    const body = JSON.parse(event.body ?? "{}");
    const { email, password } = body;

    if (!email || !EMAIL_REGEX.test(email)) {
      return badRequest("Valid email is required");
    }
    if (!password || password.length < 8) {
      return badRequest("Password must be at least 8 characters");
    }

    const table = process.env.USERS_TABLE;
    if (!table) return serverError("USERS_TABLE not configured");

    const existing = await query({
      TableName: table,
      IndexName: "email-index",
      KeyConditionExpression: "email = :email",
      ExpressionAttributeValues: { ":email": email },
    });

    if (existing.length > 0) {
      return conflict("Email already exists");
    }

    const userId = uuidv4();
    const passwordHash = await hashPassword(password);
    const now = new Date().toISOString();

    await putItem({
      TableName: table,
      Item: {
        userId,
        email,
        passwordHash,
        role: "admin",
        createdAt: now,
        createdBy: "system",
      },
    });

    return created({ userId, email });
  } catch (err) {
    console.error("createUser error", err);
    return serverError();
  }
};
