import { useCallback, useState } from "react";
import { API_BASE } from "@/lib/api";

export type Item = {
  id: string;
  name: string;
  code: string;
  kind: string;
  access: string;
  price: number | null;
  note: string;
  latitude: number;
  longitude: number;
  addedAt: string;
  hidden: boolean;
  ownerId: string | null;
  ownerName: string;
  ownerBanned: boolean;
  reportCounts: Record<string, number>;
  reportNotes?: { reason: string; note: string; at: string }[];
  reportTotal: number;
  flagged: string | null;
};
export type Counts = { visible: number; hidden: number; reported: number; flagged: number; users: number; banned: number };
export type Person = { id: string; displayName: string; createdAt: string; banned: boolean; places: number; gotIn: number };
export type PersonDetail = Person & {
  toilets: Item[];
  messages: { id: string; text: string; at: string; read: boolean }[];
};

export const KEY = "magyarotyesz:admin-token";

export class AdminError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function call<T>(token: string, path: string, method = "GET", body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(API_BASE + path, {
      method,
      cache: "no-store",
      headers: { "X-Admin-Token": token, ...(body !== undefined ? { "Content-Type": "application/json" } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new AdminError(0, "Can't reach the server. Offline, or the server doesn't allow the admin page (ADMIN_FROM_BROWSER=true).");
  }
  const data = (await response.json().catch(() => ({}))) as { error?: string; message?: string };
  if (!response.ok) {
    throw new AdminError(response.status, response.status === 401 ? "Wrong token." : (data.message ?? data.error ?? `Error ${response.status}`));
  }
  return data as T;
}

export const read = () => {
  try {
    return window.sessionStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
};
export const remember = (token: string | null) => {
  try {
    if (token) window.sessionStorage.setItem(KEY, token);
    else window.sessionStorage.removeItem(KEY);
  } catch {
    // Private mode: you sign in again after a reload.
  }
};

export const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
/** What a person is called in the lists: the name they chose, else the start of their id. */
export const who = (name: string, id: string | null) => name || (id ? id.slice(0, 9) : "?");

/**
 * Busy flag and error line for one admin panel. A wrong or locked-out token
 * signs you out; any other failure is shown and the panel keeps its data.
 */
export function useRun(onAuthError: (message: string) => void) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const run = useCallback(
    async (job: () => Promise<void>) => {
      setBusy(true);
      try {
        await job();
        setError("");
        return true;
      } catch (e) {
        if (e instanceof AdminError && (e.status === 401 || e.status === 429)) onAuthError(e.message);
        else setError(e instanceof Error ? e.message : "Something went wrong.");
        return false;
      } finally {
        setBusy(false);
      }
    },
    [onAuthError],
  );
  return { busy, error, run };
}
