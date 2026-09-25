import { Suspense } from "react";
import CollectionView from "./CollectionView";
import { collectionMetadata } from "../../../lib/serverData";

// Серверная "обёртка": превью ссылки на подборку в WhatsApp/Telegram (фото + логотип RAYAN).
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  return collectionMetadata(params.id, `/c/${params.id}`);
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CollectionView />
    </Suspense>
  );
}
