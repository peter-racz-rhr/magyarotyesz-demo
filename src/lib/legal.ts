/*
  Who runs magyarotyesz. Set these in the Vercel project (Settings > Environment
  Variables); until then the legal pages show a visible placeholder instead.
*/
export const OPERATOR = {
  name: process.env.NEXT_PUBLIC_OPERATOR_NAME?.trim() ?? "",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() ?? "",
  address: process.env.NEXT_PUBLIC_OPERATOR_ADDRESS?.trim() ?? "",
};

export type DocKey = "terms" | "privacy" | "imprint";
