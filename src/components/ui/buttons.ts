/*
  The app's three button styles, and nothing else:
  - primary: the one thing to do (Add, Save, Use it)
  - secondary: a real choice next to it (Yes / No, Directions)
  - quiet: a way out (Cancel, Dismiss, I don't know it)
  Things floating over the map (dock, Nearest, filters, search) are liquid glass instead.
*/
const base =
  "inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full font-semibold transition-[transform,background-color,color,border-color] active:scale-[0.97] disabled:opacity-40 disabled:active:scale-100";

export const btn = {
  primary: `${base} bg-ink text-night`,
  secondary: `${base} border border-dusk-edge bg-transparent text-ink hover:border-haze/60`,
  quiet: `${base} text-haze hover:text-ink`,
  /** Heights: sm 36px, md 44px. */
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-[0.9375rem]",
};
