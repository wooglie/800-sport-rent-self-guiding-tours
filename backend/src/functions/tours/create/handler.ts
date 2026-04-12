import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getItem, putItem } from "../../../lib/dynamodb";
import { created, badRequest, conflict, serverError } from "../../../lib/response";
import { TourInputSchema, TourInput } from "../../../lib/schemas";
import { triggerTourAppDeploy } from "../../../lib/triggerDeploy";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const parsed = TourInputSchema.safeParse(JSON.parse(event.body ?? "{}"));
    if (!parsed.success) return badRequest(parsed.error.message);
    const body: TourInput = parsed.data;

    const table = process.env.TOURS_TABLE;
    if (!table) return serverError("TOURS_TABLE not configured");

    const existing = await getItem({ TableName: table, Key: { id: body.id } });
    if (existing) {
      return conflict(`Tour with id '${body.id}' already exists`);
    }

    const now = new Date().toISOString();
    const tour = { ...body, createdAt: now, updatedAt: now };

    await putItem({ TableName: table, Item: tour });

    void triggerTourAppDeploy();
    return created(tour);
  } catch (err) {
    console.error("createTour error", err);
    return serverError();
  }
};
