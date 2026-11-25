import React, { useState } from 'react';
import { Baby, Note, Screen, addMonths, fmtDate, n } from './common';
import { VAX } from './data/vaccines';
import { useStore } from './storage';

export function Vax({ onBack, baby }: { onBack: () => void; baby: Baby }) {
    const [done, setDone] = useStore<Record<string, boolean>>('bm.vax.v1', {});
    const total = VAX.reduce((a, g) => a + g.doses.length, 0);
    const count = VAX.reduce((a, g) => a + g.doses.filter(d => done[d.id]).length, 0);
    const firstOpen = VAX.find(g => g.doses.some(d => !done[d.id]));
    const [open, setOpen] = useState<Record<string, boolean>>(firstOpen ? { [firstOpen.id]: true } : {});

    return <Screen title="جدول التطعيمات" onBack={onBack}>
        <section className="bm-card">
            <div className="bm-progress-line"><strong>{n(count)}</strong> من {n(total)} جرعة اتعلّمت</div>
            <div className="bm-bar" aria-hidden="true"><i style={{ width: `${(count / total) * 100}%` }} /></div>
            {!baby.birth && <p className="bm-muted">ضيفي تاريخ ميلاد طفلك في الصفحة الرئيسية وهتظهر لكل مرحلة تاريخها التقريبي.</p>}
        </section>

        {VAX.map(g => {
            const c = g.doses.filter(d => done[d.id]).length;
            const due = addMonths(baby.birth, g.months);
            const isOpen = !!open[g.id];
            return <section key={g.id} className="bm-card bm-acc">
                <button type="button" className="bm-acc-head" aria-expanded={isOpen} onClick={() => setOpen({ ...open, [g.id]: !isOpen })}>
                    <span className="bm-acc-title">{g.title}{due && <small>التاريخ التقريبي: {fmtDate(due)}</small>}</span>
                    <span className={'bm-count' + (c === g.doses.length ? ' is-full' : '')}>{n(c)}/{n(g.doses.length)}</span>
                    <span aria-hidden="true" className="bm-chev">{isOpen ? '▴' : '▾'}</span>
                </button>
                {isOpen && <ul className="bm-checks">
                    {g.doses.map(d => <li key={d.id}>
                        <button type="button" role="checkbox" aria-checked={!!done[d.id]} className={'bm-check' + (done[d.id] ? ' is-on' : '')}
                            onClick={() => setDone({ ...done, [d.id]: !done[d.id] })}>
                            <span className="bm-box" aria-hidden="true">{done[d.id] ? '✓' : ''}</span>
                            <span><b>{d.name}</b><small>{d.about}</small></span>
                        </button>
                    </li>)}
                </ul>}
            </section>;
        })}

        <section className="bm-card">
            <h3>مهم تعرفيه</h3>
            <ul className="bm-plain">
                <li>الجدول ده التطعيمات الإجبارية المجانية من وزارة الصحة من الولادة لحد ١٨ شهر، في الوحدات الصحية ومكاتب الصحة.</li>
                <li>لو فات ميعاد جرعة، متعيديش الجدول من الأول. روحي أقرب وحدة صحية أو دكتور أطفال يراجعوا كراسة التطعيمات ويحددوا الجرعات المستحقة.</li>
                <li>بلّغي الدكتور لو الطفل تعبان أو حرارته عالية قبل التطعيم، وبلّغيه بأي أعراض ظهرت بعد تطعيم قبل كده.</li>
                <li>فيه تطعيمات تانية اختيارية برا الجدول المجاني. اسألي دكتور الأطفال عنها.</li>
            </ul>
        </section>
        <Note>المصدر: صفحة تطعيمات الأطفال من يوم لـ١٨ شهر على موقع هيئة الرعاية الصحية (eha.gov.eg) وجدول وزارة الصحة والسكان المنشور في ٢٠ نوفمبر ٢٠٢٦. اتراجع في ٢٥ نوفمبر ٢٠٢٦. المواعيد الفعلية بتتحدد مع دكتورك أو الوحدة الصحية. التطبيق ده مش بديل عن الدكتور.</Note>
    </Screen>;
}
