// generateStaticParams for the [locale] segment lives in [locale]/layout.tsx,
// which covers all pages under this layout — no duplication needed here.
import { TourListPage } from "./TourListPage";

export default function Page() {
  return <TourListPage />;
}
