import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "terms · LooKey" };

export default function Page() {
  return <LegalPage doc="terms" />;
}
