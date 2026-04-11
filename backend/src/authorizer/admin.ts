import {
  APIGatewayTokenAuthorizerEvent,
  APIGatewayAuthorizerResult,
} from "aws-lambda";
import { verifyAdminAccess } from "../lib/jwt";

export const handler = async (
  event: APIGatewayTokenAuthorizerEvent,
): Promise<APIGatewayAuthorizerResult> => {
  const token = event.authorizationToken?.replace(/^Bearer\s+/i, "");

  if (!token) {
    throw new Error("Unauthorized");
  }

  const payload = verifyAdminAccess(token);

  if (!payload) {
    throw new Error("Unauthorized");
  }

  return {
    principalId: payload.userId,
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
    context: {
      userId: payload.userId,
      email: payload.email,
    },
  };
};
