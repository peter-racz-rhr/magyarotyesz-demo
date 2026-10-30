/*
  Who runs LooKey. These are the operator's details; the Vercel project's Environment
  Variables (NEXT_PUBLIC_OPERATOR_NAME, _CONTACT_EMAIL, _OPERATOR_ADDRESS, _OPERATOR_PHONE)
  override them if they are ever set.
*/
export const OPERATOR = {
  name: process.env.NEXT_PUBLIC_OPERATOR_NAME?.trim() || "Péter Rácz",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || "peter.racz.rhr@gmail.com",
  address: process.env.NEXT_PUBLIC_OPERATOR_ADDRESS?.trim() || "1183 Budapest, Kálti Márk u. 2/B, Hungary",
  /** Optional: shown on the Imprint only when set. */
  phone: process.env.NEXT_PUBLIC_OPERATOR_PHONE?.trim() || "+36 50 104 5007",
};

/** Set NEXT_PUBLIC_LEGAL_REVIEWED=true once a lawyer has read the texts: until then each page says it is a plain-language draft. */
export const LEGAL_REVIEWED = process.env.NEXT_PUBLIC_LEGAL_REVIEWED === "true";

export type DocKey = "terms" | "privacy" | "imprint";
