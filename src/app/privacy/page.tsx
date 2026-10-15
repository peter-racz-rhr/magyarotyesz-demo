import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "privacy · magyarotyesz" };

export default function Page() {
  return <LegalPage doc="privacy" />;
}
