import {
  APIGatewayTokenAuthorizerEvent,
  APIGatewayAuthorizerResult,
} from "aws-lambda";
import { verifyTourJwt } from "../lib/jwt";

export const handler = async (
  event: APIGatewayTokenAuthorizerEvent,
): Promise<APIGatewayAuthorizerResult> => {
  const token = event.authorizationToken?.replace(/^Bearer\s+/i, "");

  if (!token) {
    throw new Error("Unauthorized");
  }

  const payload = verifyTourJwt(token);

  if (!payload) {
    throw new Error("Unauthorized");
  }

  return {
    principalId: "tour",
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: "Allow",
          Resource: event.methodArn,
        },
      ],
    },
  };
};
