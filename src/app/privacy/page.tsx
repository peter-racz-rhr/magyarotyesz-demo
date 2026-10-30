import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "privacy · LooKey" };

export default function Page() {
  return <LegalPage doc="privacy" />;
}
