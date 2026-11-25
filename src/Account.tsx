import React, { useState } from 'react';
import { resetPw, signIn, signInGoogle, signOutNow, signUp, useSync } from './sync';

const MSG: Record<string, string> = {
    'auth/invalid-email': 'الإيميل مش مكتوب صح.',
    'auth/missing-password': 'اكتبي كلمة السر.',
    'auth/weak-password': 'كلمة السر ضعيفة، لازم ٦ حروف أو أرقام على الأقل.',
    'auth/email-already-in-use': 'الإيميل ده عليه حساب بالفعل. جربي تسجيل الدخول.',
    'auth/invalid-credential': 'الإيميل أو كلمة السر غلط.',
    'auth/user-not-found': 'مفيش حساب بالإيميل ده.',
    'auth/wrong-password': 'كلمة السر غلط.',
    'auth/too-many-requests': 'محاولات كتير. استني شوية وجربي تاني.',
    'auth/network-request-failed': 'مفيش نت دلوقتي. جربي تاني لما النت يرجع.',
    'auth/popup-closed-by-user': 'اتقفلت نافذة جوجل قبل ما تخلص.',
    'auth/popup-blocked': 'المتصفح منع نافذة جوجل. جربي بالإيميل.',
    'auth/unauthorized-domain': 'الدومين ده مش مفعّل لتسجيل جوجل. جربي بالإيميل.',
};
const STATUS: Record<string, string> = { off: '', syncing: 'بنحفظ بياناتك…', synced: 'بياناتك محفوظة ومتزامنة على حسابك.', error: 'حصلت مشكلة في الحفظ. بياناتك لسه على موبايلك وهنحاول تاني.', offline: 'مفيش نت. بياناتك على موبايلك وهتتحفظ على حسابك لما النت يرجع.' };

export function Account() {
    const s = useSync();
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState<'in' | 'up'>('in');
    const [email, setEmail] = useState('');
    const [pw, setPw] = useState('');
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState('');
    if (!s.configured) return null;
    const run = async (fn: () => Promise<void>, ok?: string) => {
        setBusy(true); setMsg('');
        try { await fn(); if (ok) setMsg(ok); }
        catch (e) { const c = (e as { code?: string }).code || ''; setMsg(MSG[c] || 'حصلت مشكلة. جربي تاني.'); }
        setBusy(false);
    };
    return <section className="bm-card">
        <button type="button" className="bm-acc-head" aria-expanded={open} onClick={() => setOpen(!open)}>
            <span className="bm-acc-title">{s.email ? 'حسابي' : 'حساب (اختياري)'}<small>{s.email ? s.email : 'سجلي دخول عشان بياناتك تتحفظ وتظهر على أي موبايل'}</small></span>
            <span aria-hidden="true" className="bm-chev">{open ? '▴' : '▾'}</span>
        </button>
        {open && (s.email ? <div className="bm-form">
            <p className="bm-note">{STATUS[s.status]}</p>
            <button type="button" className="bm-btn bm-ghost" disabled={busy} onClick={() => run(signOutNow)}>تسجيل الخروج</button>
            <p className="bm-note">لو خرجتي، بياناتك بتفضل على الموبايل ده وعلى حسابك.</p>
        </div> : <form className="bm-form" onSubmit={e => { e.preventDefault(); run(() => (mode === 'up' ? signUp(email.trim(), pw) : signIn(email.trim(), pw))); }}>
            <p className="bm-note">من غير حساب التطبيق بيشتغل عادي وبياناتك على الموبايل ده بس.</p>
            <label>الإيميل<input type="email" dir="ltr" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required /></label>
            <label>كلمة السر<input type="password" dir="ltr" autoComplete={mode === 'up' ? 'new-password' : 'current-password'} value={pw} onChange={e => setPw(e.target.value)} required minLength={6} /></label>
            <button type="submit" className="bm-btn bm-primary" disabled={busy}>{mode === 'up' ? 'إنشاء حساب' : 'تسجيل الدخول'}</button>
            <button type="button" className="bm-btn bm-ghost" disabled={busy} onClick={() => run(signInGoogle)}>الدخول بحساب جوجل</button>
            <button type="button" className="bm-link" onClick={() => { setMode(mode === 'up' ? 'in' : 'up'); setMsg(''); }}>{mode === 'up' ? 'عندي حساب بالفعل' : 'مفيش عندي حساب، إنشاء حساب جديد'}</button>
            {mode === 'in' && <button type="button" className="bm-link" disabled={busy || !email} onClick={() => run(() => resetPw(email.trim()), 'بعتنالك رسالة على الإيميل لتغيير كلمة السر.')}>نسيت كلمة السر (اكتبي الإيميل الأول)</button>}
        </form>)}
        {open && msg && <p className="bm-warn" role="status">{msg}</p>}
    </section>;
}
