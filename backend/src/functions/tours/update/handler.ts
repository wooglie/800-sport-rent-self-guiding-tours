import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getItem, putItem } from "../../../lib/dynamodb";
import { ok, badRequest, notFound, serverError } from "../../../lib/response";
import { TourUpdateSchema } from "../../../lib/schemas";
import { triggerTourAppDeploy } from "../../../lib/triggerDeploy";

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

    const parsed = TourUpdateSchema.safeParse(JSON.parse(event.body ?? "{}"));
    if (!parsed.success) return badRequest(parsed.error.message);
    const updates = parsed.data;

    const updatedTour = {
      ...existing,
      ...updates,
      id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };

    await putItem({ TableName: table, Item: updatedTour });

    void triggerTourAppDeploy();
    return ok(updatedTour);
  } catch (err) {
    console.error("updateTour error", err);
    return serverError();
  }
};
