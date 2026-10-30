/*
  The Android app (Capacitor, see mobile/) shows this same website in its own WebView and injects a small
  bridge, window.Capacitor. Through it the page can call the app's native parts: Android's own "Sign in with
  Google" sheet and the status bar icon colour. In a normal browser there is no bridge and none of this runs.
*/

type Bridge = {
  isNativePlatform?: () => boolean;
  nativePromise?: (plugin: string, method: string, options?: Record<string, unknown>) => Promise<unknown>;
};

const bridge = (): Bridge | undefined => (typeof window === "undefined" ? undefined : (window as unknown as { Capacitor?: Bridge }).Capacitor);

/** True inside the Android app. */
export const isNativeApp = () => !!bridge()?.isNativePlatform?.();

function call<T>(plugin: string, method: string, options: Record<string, unknown> = {}): Promise<T> {
  const native = bridge()?.nativePromise;
  return native ? (native(plugin, method, options) as Promise<T>) : Promise.reject(new Error("not in the app"));
}

let initialized: string | null = null;
/**
 * Android's "Sign in with Google" (Credential Manager): returns a Google ID token for the web client id, which the
 * server checks like the one from the website's button. Null when the person closed the sheet.
 */
export async function nativeGoogleIdToken(webClientId: string): Promise<string | null> {
  if (initialized !== webClientId) {
    await call("SocialLogin", "initialize", { google: { webClientId } });
    initialized = webClientId;
  }
  try {
    // No extra scopes: the ID token already carries the email, and asking for scopes needs native changes.
    const res = await call<{ result?: { idToken?: string | null } }>("SocialLogin", "login", { provider: "google", options: {} });
    return res.result?.idToken ?? null;
  } catch (e) {
    // Closing the sheet is a rejection too; only a real failure should say so.
    if (/cancel/i.test(String((e as Error)?.message ?? e))) return null;
    throw e;
  }
}

/** Light or dark status bar icons, to match the page's look. */
export function setNativeBarStyle(look: "light" | "dark") {
  if (!isNativeApp()) return;
  // "DARK" means a dark background, so light icons.
  void call("SystemBars", "setStyle", { style: look === "light" ? "LIGHT" : "DARK" }).catch(() => {});
}
