import { Suspense } from "react";
import PublicListing from "./PublicListing";
import { listingMetadata } from "../../../lib/serverData";

// Серверная "обёртка": отдаёт WhatsApp/Telegram карточку-превью (фото, цена, параметры, логотип),
// а сама страница — прежняя, в файле PublicListing.jsx рядом.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  return listingMetadata(params.id, `/p/${params.id}`);
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PublicListing />
    </Suspense>
  );
}
