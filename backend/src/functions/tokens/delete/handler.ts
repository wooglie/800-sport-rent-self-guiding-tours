import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getItem, deleteItem } from "../../../lib/dynamodb";
import { noContent, badRequest, forbidden, notFound, serverError } from "../../../lib/response";

interface AccessToken {
  code: string;
  firstScannedAt?: string | null;
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const code = event.pathParameters?.code;
    if (!code) return badRequest("code path parameter is required");

    const table = process.env.ACCESS_TOKENS_TABLE;
    if (!table) return serverError("ACCESS_TOKENS_TABLE not configured");

    const existing = await getItem<AccessToken>({ TableName: table, Key: { code } });
    if (!existing) return notFound(`Token '${code}' not found`);

    if (existing.firstScannedAt != null) {
      return forbidden("Token has already been used and cannot be deleted");
    }

    await deleteItem({ TableName: table, Key: { code } });

    return noContent();
  } catch (err) {
    console.error("deleteToken error", err);
    return serverError();
  }
};
