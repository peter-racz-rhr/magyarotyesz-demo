"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { hasAcceptedTerms } from "@/lib/onboarding";

/** Nobody gets past the intro to the map, a shared link included, without having agreed to the terms. */
export function TermsGuard() {
  const router = useRouter();
  useEffect(() => {
    if (!hasAcceptedTerms()) router.replace("/welcome");
  }, [router]);
  return null;
}
