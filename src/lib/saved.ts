"use client";

import { createLocalStore } from "./local-store";

/** Places you kept: ids only, stored on this phone. */
const store = createLocalStore<string[]>("magyarotyesz:saved", []);

export const useSaved = store.useValue;
export const subscribeSaved = store.subscribe;
export const setSaved = (ids: string[]) => store.set(ids);
export const getSaved = store.get;
export const toggleSaved = (id: string) => store.set((list) => (list.includes(id) ? list.filter((x) => x !== id) : [id, ...list]));
