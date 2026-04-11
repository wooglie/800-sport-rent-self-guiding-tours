import { TOUR_CATALOG } from "@/catalog";
import { TourDetailClient } from "./TourDetailClient";

export function generateStaticParams() {
  return TOUR_CATALOG.map((t) => ({ id: t.id }));
}

export default async function TourDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TourDetailClient id={id} />;
}
