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

export function readRaw(key: string): string | null {
    try { const s = ls(); return s ? s.getItem(key) : mem[key] ?? null; } catch { return null; }
}

export function readKey<T>(key: string, fallback: T): T {
    try { const raw = readRaw(key); return raw ? (JSON.parse(raw) as T) : fallback; } catch { return fallback; }
}

/** Write raw JSON. `silent` = came from sync, do not mark as a local edit. */
export function writeRaw(key: string, raw: string, silent = false) {
    mem[key] = raw;
    try { const s = ls(); if (s) s.setItem(key, raw); } catch { /* memory copy only */ }
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
