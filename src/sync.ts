import { useEffect, useState } from 'react';
import { firebaseConfig } from './firebase-config';
import { SYNC_KEYS, onLocalWrite, readRaw, writeRaw } from './storage';

export type SyncState = { ready: boolean; configured: boolean; email: string | null; status: 'off' | 'syncing' | 'synced' | 'error' | 'offline' };
let state: SyncState = { ready: false, configured: !!firebaseConfig, email: null, status: 'off' };
const subs = new Set<(s: SyncState) => void>();
function set(p: Partial<SyncState>) { state = { ...state, ...p }; subs.forEach(f => f(state)); }
export function useSync(): SyncState {
    const [s, setS] = useState(state);
    useEffect(() => { subs.add(setS); setS(state); return () => { subs.delete(setS); }; }, []);
    return s;
}

const META = 'bm.meta.v1';
type Meta = Record<string, number>;
const getMeta = (): Meta => { try { return JSON.parse(readRaw(META) || '{}'); } catch { return {}; } };
const setMeta = (m: Meta) => writeRaw(META, JSON.stringify(m), true);

let fb: typeof import('./firebase') | null = null;
let uid: string | null = null;
let unsub: (() => void) | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;

async function push() {
    if (!fb || !uid) return;
    const meta = getMeta();
    const data: Record<string, string> = {};
    SYNC_KEYS.forEach(k => { const r = readRaw(k); if (r != null) data[k.replace(/\./g, '_')] = r; });
    const m: Record<string, number> = {};
    SYNC_KEYS.forEach(k => { if (meta[k]) m[k.replace(/\./g, '_')] = meta[k]; });
    try { set({ status: 'syncing' }); await fb.saveDoc(uid, { data, meta: m }); set({ status: 'synced' }); }
    catch { set({ status: navigator.onLine ? 'error' : 'offline' }); }
}

function schedulePush() { if (timer) clearTimeout(timer); timer = setTimeout(push, 1200); }

function applyRemote(remote: { data?: Record<string, string>; meta?: Record<string, number> } | null): boolean {
    if (!remote) return true; // nothing remote: local should be pushed
    const meta = getMeta();
    let localNewer = false;
    SYNC_KEYS.forEach(k => {
        const f = k.replace(/\./g, '_');
        const rt = remote.meta?.[f] || 0, lt = meta[k] || 0, rd = remote.data?.[f];
        if (rd != null && rt > lt) { writeRaw(k, rd, true); meta[k] = rt; }
        else if (lt > rt) localNewer = true;
    });
    setMeta(meta);
    return localNewer;
}

export function initSync() {
    onLocalWrite(key => {
        if (!SYNC_KEYS.includes(key)) return;
        const m = getMeta(); m[key] = Date.now(); setMeta(m);
        if (uid) schedulePush();
    });
    window.addEventListener('online', () => { if (uid) schedulePush(); });
    if (!firebaseConfig) { set({ ready: true }); return; }
    import('./firebase').then(mod => {
        fb = mod;
        mod.watchAuth(async user => {
            if (unsub) { unsub(); unsub = null; }
            if (!user) { uid = null; set({ ready: true, email: null, status: 'off' }); return; }
            uid = user.uid;
            set({ ready: true, email: user.email, status: 'syncing' });
            try {
                const remote = await mod.loadDoc(user.uid);
                const needPush = applyRemote(remote as never);
                if (needPush) await push(); else set({ status: 'synced' });
                unsub = mod.listenDoc(user.uid, d => { if (d) { const n = applyRemote(d as never); if (n) schedulePush(); else set({ status: 'synced' }); } });
            } catch { set({ status: navigator.onLine ? 'error' : 'offline' }); }
        });
    }).catch(() => set({ ready: true }));
}

export async function signUp(email: string, pw: string) { await fb!.signUp(email, pw); }
export async function signIn(email: string, pw: string) { await fb!.signIn(email, pw); }
export async function signInGoogle() { await fb!.signInGoogle(); }
export async function resetPw(email: string) { await fb!.resetPw(email); }
export async function signOutNow() { await fb!.signOutNow(); }
