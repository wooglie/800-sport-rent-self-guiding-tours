import { TOUR_CATALOG } from "@/catalog";
import { ActiveTourClient } from "./ActiveTourClient";

export function generateStaticParams() {
  return TOUR_CATALOG.map((t) => ({ id: t.id }));
}

export default async function ActiveTourPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ActiveTourClient id={id} />;
}
