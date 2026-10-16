/*
  Who runs magyarotyesz. Set these in the Vercel project (Settings > Environment
  Variables); until then the legal pages show a visible placeholder instead.
*/
export const OPERATOR = {
  name: process.env.NEXT_PUBLIC_OPERATOR_NAME?.trim() ?? "",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() ?? "",
  address: process.env.NEXT_PUBLIC_OPERATOR_ADDRESS?.trim() ?? "",
  /** Optional: shown on the Imprint only when set. */
  phone: process.env.NEXT_PUBLIC_OPERATOR_PHONE?.trim() ?? "",
};

/** Set NEXT_PUBLIC_LEGAL_REVIEWED=true once a lawyer has read the texts: until then each page says it is a plain-language draft. */
export const LEGAL_REVIEWED = process.env.NEXT_PUBLIC_LEGAL_REVIEWED === "true";

export type DocKey = "terms" | "privacy" | "imprint";
