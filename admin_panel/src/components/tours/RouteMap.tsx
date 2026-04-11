import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Coordinates, Waypoint, Locale } from "@/types/tour";

export type RouteMapProps = {
  route: Coordinates[];
  waypoints: Waypoint[];
  startLocation: Coordinates;
  activeLocale: Locale;
};

export const RouteMap = dynamic(
  () => import("./RouteMapInner").then((m) => m.RouteMapInner),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[360px] w-full rounded-xl" />,
  }
);
