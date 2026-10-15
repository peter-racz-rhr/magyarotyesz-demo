import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "terms · magyarotyesz" };

export default function Page() {
  return <LegalPage doc="terms" />;
}
