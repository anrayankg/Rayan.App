import { Suspense } from "react";
import AgentListing from "./AgentListing";
import { listingMetadata } from "../../../lib/serverData";

// Серверная "обёртка": превью ссылки для коллеги-агента в WhatsApp/Telegram.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  return listingMetadata(params.id, `/a/${params.id}`);
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AgentListing />
    </Suspense>
  );
}
