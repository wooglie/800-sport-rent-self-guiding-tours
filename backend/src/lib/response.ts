const HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization,x-api-key",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
};

interface APIGatewayResponse {
  statusCode: number;
  headers: typeof HEADERS;
  body: string;
}

function respond(statusCode: number, body: unknown): APIGatewayResponse {
  return {
    statusCode,
    headers: HEADERS,
    body: JSON.stringify(body),
  };
}

export function ok(body: unknown): APIGatewayResponse {
  return respond(200, body);
}

export function created(body: unknown): APIGatewayResponse {
  return respond(201, body);
}

export function noContent(): APIGatewayResponse {
  return { statusCode: 204, headers: HEADERS, body: "" };
}

export function badRequest(message: string): APIGatewayResponse {
  return respond(400, { error: message });
}

export function unauthorized(message = "Unauthorized"): APIGatewayResponse {
  return respond(401, { error: message });
}

export function forbidden(message = "Forbidden"): APIGatewayResponse {
  return respond(403, { error: message });
}

export function notFound(message = "Not found"): APIGatewayResponse {
  return respond(404, { error: message });
}

export function conflict(message: string): APIGatewayResponse {
  return respond(409, { error: message });
}

export function serverError(
  message = "Internal server error",
): APIGatewayResponse {
  return respond(500, { error: message });
}
