import { useCallback, useEffect, useState } from 'react';

const mem: Record<string, string> = {};
const listeners = new Set<() => void>();
const writeHooks = new Set<(key: string) => void>();
export const SYNC_KEYS = ['bm.baby.v1', 'bm.log.v1', 'bm.ml.v1', 'bm.miles.v1', 'bm.sleep.v1', 'bm.vax.v1'];

function ls(): Storage | null {
    try {
        const s = window.localStorage;
        const k = '__bm_test';
        s.setItem(k, '1');
        s.removeItem(k);
        return s;
    } catch {
        return null;
    }
}

export function storageWorks(): boolean { return ls() !== null; }

// Data scopes: guest data lives under the plain `bm.*` keys. Signed-in data lives under `bm.u.<uid>.*`.
// The two never mix: guest data is never uploaded, and one account's data is never visible to another.
const SCOPE_HINT = 'bm.scope';
const META_KEY = 'bm.meta.v1';
let scope: string | null = (() => { try { return ls()?.getItem(SCOPE_HINT) || null; } catch { return null; } })();
const phys = (key: string) => (scope ? 'bm.u.' + scope + '.' + key.slice(3) : key);
const rawAt = (k: string): string | null => { try { const s = ls(); return s ? s.getItem(k) : mem[k] ?? null; } catch { return null; } };

export function getScope() { return scope; }
export function setScope(next: string | null) {
    if (next === scope) return;
    scope = next;
    try { const s = ls(); if (s) { if (next) s.setItem(SCOPE_HINT, next); else s.removeItem(SCOPE_HINT); } } catch { /* ignore */ }
    listeners.forEach(fn => fn());
}
/** Remove the local cache of one account (used on sign-out). The data stays safe on the server. */
export function clearAccountCache(uid: string) {
    [...SYNC_KEYS, META_KEY].forEach(k => {
        const pk = 'bm.u.' + uid + '.' + k.slice(3);
        delete mem[pk];
        try { const s = ls(); if (s) s.removeItem(pk); } catch { /* ignore */ }
    });
}
export function readGuestRaw(key: string): string | null { return rawAt(key); }
export function hasGuestData(): boolean { return SYNC_KEYS.some(k => rawAt(k) != null); }

export function readRaw(key: string): string | null { return rawAt(phys(key)); }

export function readKey<T>(key: string, fallback: T): T {
    try { const raw = readRaw(key); return raw ? (JSON.parse(raw) as T) : fallback; } catch { return fallback; }
}

/** Write raw JSON. `silent` = came from sync, do not mark as a local edit. */
export function writeRaw(key: string, raw: string, silent = false) {
    const pk = phys(key);
    mem[pk] = raw;
    try { const s = ls(); if (s) s.setItem(pk, raw); } catch { /* memory copy only */ }
    listeners.forEach(fn => fn());
    if (!silent) writeHooks.forEach(fn => fn(key));
}

export function writeKey<T>(key: string, value: T) { writeRaw(key, JSON.stringify(value)); }
export function onLocalWrite(fn: (key: string) => void) { writeHooks.add(fn); return () => { writeHooks.delete(fn); }; }

export function useStore<T>(key: string, fallback: T): [T, (next: T | ((prev: T) => T)) => void] {
    const [value, setValue] = useState<T>(() => readKey(key, fallback));
    useEffect(() => {
        const fn = () => setValue(readKey(key, fallback));
        listeners.add(fn);
        return () => { listeners.delete(fn); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);
    const set = useCallback((next: T | ((prev: T) => T)) => {
        const prev = readKey(key, fallback);
        const v = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
        writeKey(key, v);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);
    return [value, set];
}
