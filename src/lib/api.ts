/**
 * The server, if there is one. With NEXT_PUBLIC_API_URL set the app shares
 * codes through it; without it everything stays on this phone (the demo).
 */
const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ?? "";

export const REMOTE = base !== "";

/** The server said no (4xx/5xx), with its machine-readable code. */
export class ApiFailure extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

/** No answer at all: offline, DNS, timeout. Always worth retrying later. */
export class Offline extends Error {}

type Options = { method?: string; token?: string; body?: unknown; etag?: string; timeoutMs?: number };

export async function api<T>(path: string, { method = "GET", token, body, etag, timeoutMs = 20000 }: Options = {}) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;
  try {
    response = await fetch(base + path, {
      method,
      signal: controller.signal,
      cache: "no-store",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(etag ? { "If-None-Match": etag } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Offline();
  } finally {
    window.clearTimeout(timer);
  }
  if (response.status === 304) return { notModified: true as const, etag: response.headers.get("ETag") ?? undefined };
  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    throw new ApiFailure(response.status, String(data.error ?? "error"), String(data.message ?? response.statusText));
  }
  return { notModified: false as const, data: data as T, etag: response.headers.get("ETag") ?? undefined };
}
