import React, { useEffect, useState } from 'react';
import { Note, Screen, n } from './common';
import { useStore } from './storage';

type Kind = 'bl' | 'br' | 'bottle' | 'wet' | 'dirty';
interface Entry { id: number; t: number; k: Kind; ml?: number }

const LABEL: Record<Kind, string> = { bl: 'رضاعة من الشمال', br: 'رضاعة من اليمين', bottle: 'بزازة', wet: 'حفاض مبلل', dirty: 'حفاض متسخ' };
const MAX = 600;

const dayKey = (t: number) => { const d = new Date(t); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); };
const timeStr = (t: number) => new Date(t).toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit' });
const dayStr = (t: number) => new Date(t).toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' });

function ago(t: number, now: number) {
    const m = Math.max(0, Math.round((now - t) / 60000));
    if (m < 1) return 'دلوقتي';
    if (m < 60) return `من ${n(m)} دقيقة`;
    const h = Math.floor(m / 60);
    const r = m % 60;
    if (h === 1) return r ? `من ساعة و${n(r)} دقيقة` : 'من ساعة';
    if (h === 2) return r ? `من ساعتين و${n(r)} دقيقة` : 'من ساعتين';
    return r ? `من ${n(h)} ساعات و${n(r)} دقيقة` : `من ${n(h)} ساعات`;
}

function summarize(list: Entry[]) {
    const s = { bl: 0, br: 0, bottle: 0, ml: 0, wet: 0, dirty: 0 };
    for (const e of list) {
        if (e.k === 'bottle') { s.bottle++; s.ml += e.ml ?? 0; } else s[e.k]++;
    }
    return s;
}

export function Log({ onBack }: { onBack: () => void }) {
    const [log, setLog] = useStore<Entry[]>('bm.log.v1', []);
    const [ml, setMl] = useStore<number>('bm.ml.v1', 120);
    const [undo, setUndo] = useState<{ id: number; text: string } | null>(null);
    const [now, setNow] = useState(Date.now());
    const [armed, setArmed] = useState<number | 'all' | null>(null);

    useEffect(() => { const id = window.setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(id); }, []);
    useEffect(() => { if (!undo) return; const id = window.setTimeout(() => setUndo(null), 8000); return () => clearTimeout(id); }, [undo]);
    useEffect(() => { if (armed === null) return; const id = window.setTimeout(() => setArmed(null), 4000); return () => clearTimeout(id); }, [armed]);

    const add = (k: Kind, extra?: number) => {
        const t = Date.now();
        const entry: Entry = { id: t * 1000 + Math.floor(Math.random() * 1000), t, k, ...(extra ? { ml: extra } : {}) };
        setLog(prev => [entry, ...prev].slice(0, MAX));
        setNow(t);
        setUndo({ id: entry.id, text: `اتسجّل: ${LABEL[k]}${extra ? ' ' + n(extra) + ' مل' : ''}` });
    };
    const remove = (id: number) => { setLog(prev => prev.filter(e => e.id !== id)); setUndo(u => (u && u.id === id ? null : u)); setArmed(null); };

    const today = dayKey(now);
    const todays = log.filter(e => dayKey(e.t) === today);
    const sum = summarize(todays);
    const feeds = sum.bl + sum.br + sum.bottle;
    const lastFeed = log.find(e => e.k === 'bl' || e.k === 'br' || e.k === 'bottle');

    const days: { key: number; t: number; items: Entry[] }[] = [];
    for (const e of log) {
        const k = dayKey(e.t);
        const last = days[days.length - 1];
        if (last && last.key === k) last.items.push(e); else days.push({ key: k, t: e.t, items: [e] });
    }

    return <Screen title="الرضاعة والحفاضات" onBack={onBack}>

        <section className="bm-card">
            <h3>رضاعة طبيعية</h3>
            <div className="bm-pair" dir="ltr">
                <button type="button" className="bm-big" onClick={() => add('bl')}><span>الشمال</span><small>رضاعة</small></button>
                <button type="button" className="bm-big" onClick={() => add('br')}><span>اليمين</span><small>رضاعة</small></button>
            </div>
        </section>

        <section className="bm-card">
            <h3>بزازة</h3>
            <div className="bm-chips" role="radiogroup" aria-label="كمية البزازة بالمل">
                {[60, 90, 120, 150, 180].map(v => <button key={v} type="button" role="radio" aria-checked={ml === v}
                    className={'bm-chip' + (ml === v ? ' is-on' : '')} onClick={() => setMl(v)}>{n(v)}</button>)}
            </div>
            <div className="bm-stepper">
                <button type="button" className="bm-step" aria-label="قلّلي ١٠ مل" onClick={() => setMl(Math.max(10, ml - 10))}>−</button>
                <div className="bm-ml"><strong>{n(ml)}</strong> مل</div>
                <button type="button" className="bm-step" aria-label="زوّدي ١٠ مل" onClick={() => setMl(Math.min(400, ml + 10))}>+</button>
            </div>
            <button type="button" className="bm-btn bm-primary" onClick={() => add('bottle', ml)}>سجّلي بزازة {n(ml)} مل</button>
        </section>

        <section className="bm-card">
            <h3>الحفاضات</h3>
            <div className="bm-pair">
                <button type="button" className="bm-big" onClick={() => add('wet')}><span>مبلل</span><small>حفاض</small></button>
                <button type="button" className="bm-big" onClick={() => add('dirty')}><span>متسخ</span><small>حفاض</small></button>
            </div>
        </section>

        {undo && <div className="bm-toast" role="status">
            <span>{undo.text}</span>
            <button type="button" onClick={() => remove(undo.id)}>تراجع</button>
        </div>}

        <section className="bm-card">
            <h3>ملخص النهارده</h3>
            <div className="bm-stats">
                <div><strong>{n(feeds)}</strong><span>رضعات</span></div>
                <div><strong>{n(sum.bl)}</strong><span>شمال</span></div>
                <div><strong>{n(sum.br)}</strong><span>يمين</span></div>
                <div><strong>{n(sum.ml)}</strong><span>مل بزازة</span></div>
                <div><strong>{n(sum.wet)}</strong><span>مبلل</span></div>
                <div><strong>{n(sum.dirty)}</strong><span>متسخ</span></div>
            </div>
            <p className="bm-last">{lastFeed ? `آخر رضعة ${ago(lastFeed.t, now)} (${timeStr(lastFeed.t)})` : 'لسه مفيش رضعات متسجلة'}</p>
        </section>

        <section className="bm-card">
            <h3>السجل</h3>
            {days.length === 0 && <p className="bm-muted">لسه مفيش حاجة. أول ما تسجّلي هتظهر هنا.</p>}
            {days.map(d => {
                const s = summarize(d.items);
                return <div key={d.key} className="bm-day">
                    <h4>{dayStr(d.t)}</h4>
                    <p className="bm-muted">{n(s.bl + s.br + s.bottle)} رضعات، {n(s.ml)} مل بزازة، {n(s.wet)} مبلل، {n(s.dirty)} متسخ</p>
                    <ul>
                        {d.items.map(e => <li key={e.id}>
                            <span className="bm-time">{timeStr(e.t)}</span>
                            <span className="bm-what">{LABEL[e.k]}{e.k === 'bottle' && e.ml ? ` ${n(e.ml)} مل` : ''}</span>
                            <button type="button" className={'bm-del' + (armed === e.id ? ' is-armed' : '')}
                                aria-label={`مسح ${LABEL[e.k]} الساعة ${timeStr(e.t)}`}
                                onClick={() => (armed === e.id ? remove(e.id) : setArmed(e.id))}>{armed === e.id ? 'تأكيد؟' : 'مسح'}</button>
                        </li>)}
                    </ul>
                </div>;
            })}
            {log.length > 0 && <button type="button" className={'bm-btn bm-ghost' + (armed === 'all' ? ' is-armed' : '')}
                onClick={() => { if (armed === 'all') { setLog([]); setArmed(null); } else setArmed('all'); }}>
                {armed === 'all' ? 'اضغطي تاني لمسح كل السجل' : 'مسح كل السجل'}
            </button>}
        </section>
        <Note>السجل مبيروحش لأي مكان غير شاشتك. بيحتفظ بآخر {n(MAX)} تسجيل.</Note>
    </Screen>;
}
