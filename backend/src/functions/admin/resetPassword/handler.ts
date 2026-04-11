import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getItem, updateItem } from "../../../lib/dynamodb";
import { hashPassword } from "../../../lib/password";
import {
  ok,
  badRequest,
  forbidden,
  notFound,
  serverError,
} from "../../../lib/response";

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    const apiKey = event.headers["x-api-key"] ?? event.headers["X-Api-Key"];
    if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
      return forbidden();
    }

    const userId = event.pathParameters?.userId;
    if (!userId) {
      return badRequest("userId path parameter is required");
    }

    const body = JSON.parse(event.body ?? "{}");
    const { newPassword } = body;

    if (!newPassword || newPassword.length < 8) {
      return badRequest("newPassword must be at least 8 characters");
    }

    const table = process.env.USERS_TABLE;
    if (!table) return serverError("USERS_TABLE not configured");

    const user = await getItem({ TableName: table, Key: { userId } });
    if (!user) {
      return notFound("User not found");
    }

    const passwordHash = await hashPassword(newPassword);

    await updateItem({
      TableName: table,
      Key: { userId },
      UpdateExpression: "SET passwordHash = :hash",
      ExpressionAttributeValues: { ":hash": passwordHash },
    });

    return ok({ message: "Password reset" });
  } catch (err) {
    console.error("resetPassword error", err);
    return serverError();
  }
};
