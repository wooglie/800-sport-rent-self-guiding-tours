import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getItem, putItem } from "../../../lib/dynamodb";
import { created, badRequest, conflict, serverError } from "../../../lib/response";

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

interface Coordinates {
  lat: number;
  lng: number;
}

interface Waypoint {
  id: string;
  coordinates: Coordinates;
  triggerRadiusMeters: number;
  name: { hr: string; en: string };
  description: { hr: string; en: string };
  images: string[];
}

interface TourInput {
  id: string;
  name: { hr: string; en: string };
  description: { hr: string; en: string };
  distance: string;
  duration: string;
  difficulty: "easy" | "moderate" | "hard";
  coverImage: string;
  startLocation: Coordinates;
  route: Coordinates[];
  waypoints: Waypoint[];
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body ?? "{}") as TourInput;

    if (!body.id || !SLUG_REGEX.test(body.id)) {
      return badRequest("id must be a URL-safe slug (lowercase letters, numbers, hyphens)");
    }
    if (!body.name?.hr || !body.name?.en) {
      return badRequest("name.hr and name.en are required");
    }
    if (!Array.isArray(body.route) || body.route.length < 2) {
      return badRequest("route must have at least 2 points");
    }
    if (!Array.isArray(body.waypoints) || body.waypoints.length < 1) {
      return badRequest("at least one waypoint is required");
    }

    const table = process.env.TOURS_TABLE;
    if (!table) return serverError("TOURS_TABLE not configured");

    const existing = await getItem({ TableName: table, Key: { id: body.id } });
    if (existing) {
      return conflict(`Tour with id '${body.id}' already exists`);
    }

    const now = new Date().toISOString();
    const tour = { ...body, createdAt: now, updatedAt: now };

    await putItem({ TableName: table, Item: tour });

    return created(tour);
  } catch (err) {
    console.error("createTour error", err);
    return serverError();
  }
};
