import { APIGatewayProxyResult } from "aws-lambda";
import { ok } from "../../../lib/response";

export const handler = async (): Promise<APIGatewayProxyResult> => {
  return ok({ message: "Logged out" });
};
