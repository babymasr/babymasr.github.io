import React, { useEffect, useRef, useState } from 'react';
import { Noise, fadeOut, setVolume, startSound, stopSound } from './audio';
import { Note, Screen, n } from './common';
import { useStore } from './storage';

interface Prefs { noise: Noise; lullaby: boolean; minutes: number; volume: number }
const DEFAULTS: Prefs = { noise: 'pink', lullaby: false, minutes: 30, volume: 0.35 };

const NOISES: { v: Noise; label: string }[] = [
    { v: 'white', label: 'ضوضاء بيضاء' },
    { v: 'pink', label: 'ضوضاء ناعمة' },
    { v: 'brown', label: 'ضوضاء عميقة' },
    { v: 'none', label: 'من غير ضوضاء' },
];

function clock(sec: number) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${n(m)}:${s < 10 ? '٠' : ''}${n(s)}`;
}

export function Sleep({ onBack }: { onBack: () => void }) {
    const [prefs, setPrefs] = useStore<Prefs>('bm.sleep.v1', DEFAULTS);
    const [endAt, setEndAt] = useState<number | null>(null);
    const [left, setLeft] = useState(0);
    const [error, setError] = useState('');
    const endRef = useRef<number | null>(null);
    endRef.current = endAt;

    useEffect(() => () => stopSound(), []);

    useEffect(() => {
        if (endAt === null) return;
        let fading = false;
        const id = window.setInterval(() => {
            const rem = Math.round(((endRef.current ?? 0) - Date.now()) / 1000);
            setLeft(Math.max(0, rem));
            if (rem <= 6 && !fading) { fading = true; fadeOut(6); }
            if (rem <= 0) { stopSound(); setEndAt(null); }
        }, 500);
        return () => clearInterval(id);
    }, [endAt]);

    const canStart = prefs.noise !== 'none' || prefs.lullaby;

    const start = async () => {
        setError('');
        try {
            await startSound({ noise: prefs.noise, lullaby: prefs.lullaby, volume: prefs.volume });
            const e = Date.now() + prefs.minutes * 60000;
            setLeft(prefs.minutes * 60);
            setEndAt(e);
        } catch {
            setError('المتصفح منع تشغيل الصوت. جرّبي تضغطي تاني أو افتحي اللينك في كروم أو سفاري.');
        }
    };
    const stop = () => { stopSound(); setEndAt(null); };
    const more = () => setEndAt(e => (e ?? Date.now()) + 15 * 60000);

    if (endAt !== null) {
        return <div className="bm-night" role="region" aria-label="وضع النوم">
            <div className="bm-night-time" aria-live="off">{clock(left)}</div>
            <div className="bm-night-hint">الصوت شغال. الشاشة سودا عشان ما تصحيش البيبي</div>
            <button type="button" className="bm-night-btn" onClick={stop}>إيقاف</button>
            <button type="button" className="bm-night-btn bm-night-more" onClick={more}>كمّل ١٥ دقيقة</button>
        </div>;
    }

    return <Screen title="تنويم البيبي" onBack={onBack} persist={false}>
        <section className="bm-card">
            <h3>الصوت</h3>
            <div className="bm-choices" role="radiogroup" aria-label="نوع الصوت">
                {NOISES.map(o => <button key={o.v} type="button" role="radio" aria-checked={prefs.noise === o.v}
                    className={'bm-choice' + (prefs.noise === o.v ? ' is-on' : '')}
                    onClick={() => setPrefs({ ...prefs, noise: o.v })}>{o.label}</button>)}
            </div>
            <button type="button" role="switch" aria-checked={prefs.lullaby}
                className={'bm-choice bm-wide' + (prefs.lullaby ? ' is-on' : '')}
                onClick={() => setPrefs({ ...prefs, lullaby: !prefs.lullaby })}>
                {prefs.lullaby ? '✓ ' : ''}هدهدة هادية (لحن بسيط)
            </button>
        </section>
        <section className="bm-card">
            <h3>مدة التشغيل</h3>
            <div className="bm-choices bm-three" role="radiogroup" aria-label="المدة">
                {[15, 30, 60].map(m => <button key={m} type="button" role="radio" aria-checked={prefs.minutes === m}
                    className={'bm-choice' + (prefs.minutes === m ? ' is-on' : '')}
                    onClick={() => setPrefs({ ...prefs, minutes: m })}>{n(m)} دقيقة</button>)}
            </div>
        </section>
        <section className="bm-card">
            <h3>مستوى الصوت</h3>
            <input className="bm-range" type="range" min={5} max={100} step={5} dir="ltr"
                aria-label="مستوى الصوت" value={Math.round(prefs.volume * 100)}
                onChange={e => { const v = Number(e.target.value) / 100; setPrefs({ ...prefs, volume: v }); setVolume(v); }} />
            <Note>خلّي الصوت هادي وبعيد عن ودن البيبي.</Note>
        </section>
        <button type="button" className="bm-btn bm-primary" disabled={!canStart} onClick={() => { void start(); }}>
            ابدئي التشغيل لمدة {n(prefs.minutes)} دقيقة
        </button>
        {error && <p className="bm-error" role="alert">{error}</p>}
        <Note>الصوت بيتولّد على موبايلك نفسه من غير تحميل ولا نت. التشغيل بيطفي نفسه تدريجيا لما المدة تخلص. لو الموبايل اتقفل ممكن الصوت يقف، فسيبي الصفحة مفتوحة.</Note>
    </Screen>;
}
