import { Coffee, Crown, Gem, KeyRound, Leaf, ShieldCheck, Star, type LucideIcon } from "lucide-react";
import { LEVEL_STEPS } from "./toilets";

/*
  Every badge in the app: one per rank (by how many people got in with your codes) and Supporter (Ko-fi).
  The rank-up animation, the Profile's badges section and the badges shown under your name all use these.
*/

export type BadgeId = `rank-${number}` | "supporter";
export type Badge = { id: BadgeId; Icon: LucideIcon; color: string; rank?: number };

export const RANK_BADGES: Badge[] = [
  { id: "rank-0", Icon: Leaf, color: "#9aa3ad", rank: 0 },
  { id: "rank-1", Icon: Star, color: "#4fe08a", rank: 1 },
  { id: "rank-2", Icon: ShieldCheck, color: "#5db4f0", rank: 2 },
  { id: "rank-3", Icon: KeyRound, color: "#cba6f7", rank: 3 },
  { id: "rank-4", Icon: Crown, color: "#ffc247", rank: 4 },
  { id: "rank-5", Icon: Gem, color: "#f5a3c7", rank: 5 },
];
export const SUPPORTER_BADGE: Badge = { id: "supporter", Icon: Coffee, color: "#fab387" };
export const ALL_BADGES: Badge[] = [...RANK_BADGES, SUPPORTER_BADGE];

/** How many badges can be shown under your name. */
export const SHOWN_MAX = 3;

export function earned(badge: Badge, gotIn: number, supporter: boolean) {
  return badge.rank !== undefined ? gotIn >= LEVEL_STEPS[badge.rank] : supporter;
}

/**
 * The badges under your name: the ones you picked (still earned), or, if you haven't picked any, your best rank
 * and Supporter. `picked` is the comma-separated list kept in the settings.
 */
export function shownBadges(picked: string, gotIn: number, supporter: boolean): Badge[] {
  const have = ALL_BADGES.filter((b) => earned(b, gotIn, supporter));
  if (picked) return picked.split(",").map((id) => have.find((b) => b.id === id)).filter((b): b is Badge => !!b).slice(0, SHOWN_MAX);
  const best = [...have].reverse().find((b) => b.rank !== undefined && b.rank > 0);
  return [best, supporter ? SUPPORTER_BADGE : undefined].filter((b): b is Badge => !!b);
}
