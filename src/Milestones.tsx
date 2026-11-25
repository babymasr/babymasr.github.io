import React, { useState } from 'react';
import { Baby, Note, Screen, ageParts, n } from './common';
import { MILESTONES } from './data/milestones';
import { useStore } from './storage';

export function Milestones({ onBack, baby }: { onBack: () => void; baby: Baby }) {
    const [done, setDone] = useStore<Record<string, boolean>>('bm.miles.v1', {});
    const age = ageParts(baby.birth);
    const near = age ? Math.max(1, Math.min(12, Math.round(age.fractional))) : 0;
    const [open, setOpen] = useState<Record<number, boolean>>(near ? { [near]: true } : { 1: true });

    return <Screen title="مراحل النمو شهر بشهر" onBack={onBack}>
        <p className="bm-soft">كل طفل ليه إيقاعه، وده طبيعي. القوايم دي بتوصف اللي بيعمله أغلب الأطفال تقريبا في كل شهر، مش اختبار ولا تشخيص. أي سؤال أو قلق، اسألي دكتور الأطفال.</p>
        {MILESTONES.map(m => {
            const c = m.items.filter((_, i) => done[`${m.month}-${i}`]).length;
            const isOpen = !!open[m.month];
            return <section key={m.month} className="bm-card bm-acc">
                <button type="button" className="bm-acc-head" aria-expanded={isOpen} onClick={() => setOpen({ ...open, [m.month]: !isOpen })}>
                    <span className="bm-acc-title">{m.month === 12 ? 'الشهر ١٢ (سنة)' : `الشهر ${n(m.month)}`}{near === m.month && <small>الأقرب لعمر طفلك</small>}</span>
                    <span className={'bm-count' + (c === m.items.length ? ' is-full' : '')}>{n(c)}/{n(m.items.length)}</span>
                    <span aria-hidden="true" className="bm-chev">{isOpen ? '▴' : '▾'}</span>
                </button>
                {isOpen && <>
                    <ul className="bm-checks">
                        {m.items.map((t, i) => {
                            const k = `${m.month}-${i}`;
                            return <li key={k}>
                                <button type="button" role="checkbox" aria-checked={!!done[k]} className={'bm-check' + (done[k] ? ' is-on' : '')}
                                    onClick={() => setDone({ ...done, [k]: !done[k] })}>
                                    <span className="bm-box" aria-hidden="true">{done[k] ? '✓' : ''}</span>
                                    <span><b>{t}</b></span>
                                </button>
                            </li>;
                        })}
                    </ul>
                    <p className="bm-muted bm-src">{m.source === 'cdc' ? 'من قوايم الـCDC لما "أغلب الأطفال بيعملوه لحد" الشهر ده.' : 'مراحل عامة بيوصلها كتير من الأطفال في الفترة دي.'}</p>
                </>}
            </section>;
        })}
        <Note>الشهور ٢ و٤ و٦ و٩ و١٢ مبنية على قوايم مراحل النمو من مراكز السيطرة على الأمراض الأمريكية (CDC، محدّثة سبتمبر ٢٠٢٥) وبتصرّف في الصياغة. باقي الشهور وصف عام. لو لاحظتي إن طفلك فقد مهارة كان بيعملها، أو عندك أي قلق، كلمي الدكتور.</Note>
    </Screen>;
}
