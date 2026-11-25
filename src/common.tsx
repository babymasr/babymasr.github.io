import React from 'react';
import { storageWorks } from './storage';

export const n = (x: number) => x.toLocaleString('ar-EG');

export interface Baby { name: string; birth: string }

export function ageParts(birth: string, now = new Date()) {
    if (!birth) return null;
    const b = new Date(birth + 'T00:00:00');
    if (isNaN(b.getTime()) || b > now) return null;
    let months = (now.getFullYear() - b.getFullYear()) * 12 + now.getMonth() - b.getMonth();
    let anchor = new Date(b.getFullYear(), b.getMonth() + months, b.getDate());
    if (anchor > now) { months -= 1; anchor = new Date(b.getFullYear(), b.getMonth() + months, b.getDate()); }
    const days = Math.floor((now.getTime() - anchor.getTime()) / 86400000);
    return { months, days, fractional: months + days / 30 };
}

export function addMonths(birth: string, months: number): Date | null {
    if (!birth) return null;
    const b = new Date(birth + 'T00:00:00');
    if (isNaN(b.getTime())) return null;
    return new Date(b.getFullYear(), b.getMonth() + months, b.getDate());
}

export function fmtDate(d: Date) {
    return d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });
}

export const NO_SAVE = 'المتصفح ده مش بيسمح بحفظ البيانات على الموبايل، فاللي تسجّليه هيضيع لما تقفلي الصفحة. جربي تفتحي التطبيق في Safari أو Chrome العادي.';

export function Screen({ title, onBack, persist = true, children }: { title: string; onBack: () => void; persist?: boolean; children: React.ReactNode }) {
    return <div className="bm-screen">
        <div className="bm-top">
            <button type="button" className="bm-back" onClick={onBack} aria-label="رجوع للرئيسية">
                <span aria-hidden="true">→</span> الرئيسية
            </button>
            <h2>{title}</h2>
        </div>
        {persist && !storageWorks() && <p className="bm-warn" role="status">{NO_SAVE}</p>}
        {children}
        <button type="button" className="bm-btn bm-ghost bm-bottomback" onClick={onBack}>رجوع للرئيسية</button>
    </div>;
}

export function Note({ children }: { children: React.ReactNode }) {
    return <p className="bm-note">{children}</p>;
}
