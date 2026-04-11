import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getItem, putItem } from "../../../lib/dynamodb";
import { ok, badRequest, notFound, serverError } from "../../../lib/response";

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    const id = event.pathParameters?.id;
    if (!id) return badRequest("id path parameter is required");

    const table = process.env.TOURS_TABLE;
    if (!table) return serverError("TOURS_TABLE not configured");

    const existing = await getItem<Record<string, unknown>>({
      TableName: table,
      Key: { id },
    });

    if (!existing) {
      return notFound(`Tour '${id}' not found`);
    }

    const updates = JSON.parse(event.body ?? "{}");

    // id and timestamps are not updatable
    const { id: _id, createdAt: _createdAt, ...rest } = updates;
    void _id;
    void _createdAt;

    const updatedTour = {
      ...existing,
      ...rest,
      id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };

    await putItem({ TableName: table, Item: updatedTour });

    return ok(updatedTour);
  } catch (err) {
    console.error("updateTour error", err);
    return serverError();
  }
};
