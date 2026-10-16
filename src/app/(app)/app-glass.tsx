"use client";

import type { ReactNode } from "react";
import { LiquefyProvider } from "@/lib/provider";
import { useLook } from "@/lib/theme";

/** Liquid glass for the controls that float over the map, in the app's current look. */
export function AppGlass({ children }: { children: ReactNode }) {
  const look = useLook();
  return (
    <LiquefyProvider theme={look} tint="#4fe08a" intensity={1}>
      {children}
    </LiquefyProvider>
  );
}
