import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { v4 as uuidv4 } from "uuid";
import { query, putItem } from "../../../lib/dynamodb";
import { hashPassword } from "../../../lib/password";
import { created, badRequest, conflict, serverError } from "../../../lib/response";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const createdBy = event.requestContext.authorizer?.userId as string | undefined;

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
        createdBy: createdBy ?? "unknown",
      },
    });

    return created({ userId, email });
  } catch (err) {
    console.error("createUser error", err);
    return serverError();
  }
};
