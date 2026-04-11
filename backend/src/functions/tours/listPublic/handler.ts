import { APIGatewayProxyResult } from "aws-lambda";
import { scan } from "../../../lib/dynamodb";
import { ok, serverError } from "../../../lib/response";

export const handler = async (): Promise<APIGatewayProxyResult> => {
  try {
    const table = process.env.TOURS_TABLE;
    if (!table) return serverError("TOURS_TABLE not configured");

    const tours = await scan({ TableName: table });

    return ok(tours);
  } catch (err) {
    console.error("listPublicTours error", err);
    return serverError();
  }
};
