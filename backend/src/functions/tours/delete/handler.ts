import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getItem, deleteItem } from "../../../lib/dynamodb";
import {
  noContent,
  badRequest,
  notFound,
  serverError,
} from "../../../lib/response";
import { triggerTourAppDeploy } from "../../../lib/triggerDeploy";

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    const id = event.pathParameters?.id;
    if (!id) return badRequest("id path parameter is required");

    const table = process.env.TOURS_TABLE;
    if (!table) return serverError("TOURS_TABLE not configured");

    const existing = await getItem({ TableName: table, Key: { id } });
    if (!existing) {
      return notFound(`Tour '${id}' not found`);
    }

    await deleteItem({ TableName: table, Key: { id } });

    await triggerTourAppDeploy();

    return noContent();
  } catch (err) {
    console.error("deleteTour error", err);
    return serverError();
  }
};
