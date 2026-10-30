import { useSyncExternalStore } from "react";
import { isNativeApp } from "./native";

/** Where donations go (Ko-fi). */
export const SUPPORT_URL = "https://ko-fi.com/peteracz";

/**
 * Whether to offer the donation link: on the website, yes. In the Android app not for now, since Google Play has
 * its own rules about asking for money inside apps (to be checked before publishing).
 */
export const useShowSupport = () => useSyncExternalStore(
  () => () => {},
  () => !isNativeApp(),
  () => false,
);
