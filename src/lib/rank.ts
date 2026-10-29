"use client";

import { REMOTE } from "./api";
import { useGotInTotal } from "./sync";
import { useToilets } from "./toilets";

/** How many people got in with this person's codes: from the server, or counted on the phone in the demo. */
export function useGotIn() {
  const serverGotIn = useGotInTotal();
  const toilets = useToilets();
  if (REMOTE) return serverGotIn;
  return toilets.filter((x) => x.mine).reduce((n, x) => n + Math.max(0, x.confirms - (x.myVote === "works" ? 1 : 0)), 0);
}
