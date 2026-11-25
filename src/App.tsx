import React, { useEffect, useState } from 'react';
import logo from './photos/logo.png';
import { Account } from './Account';
import { Baby, ageParts, n } from './common';
import { Log } from './Log';
import { Milestones } from './Milestones';
import { Sleep } from './Sleep';
import { storageWorks, useStore } from './storage';
import { Vax } from './Vax';
import { Videos } from './Videos';

type Section = 'home' | 'sleep' | 'log' | 'vax' | 'miles' | 'videos';

const P = (d: string) => <svg viewBox="0 0 24 24" aria-hidden="true"><path d={d} /></svg>;
const ICONS: Record<string, React.ReactNode> = {
    sleep: P('M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z'),
    log: P('M9 3h6M10 3v3h4V3M8 6h8l1 4v10a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 7 20V10z M7.5 13h9'),
    vax: P('M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z M12 8v6 M9 11h6'),
    miles: P('M12 21v-9 M12 12c0-4 2.5-6 7-6 0 4-2.5 6-7 6z M12 15c0-3-2-5-6-5 0 3 2 5 6 5z'),
    videos: P('M8 5.5v13l11-6.5z'),
};
const TILES: { id: Exclude<Section, 'home'>; title: string; sub: string }[] = [
    { id: 'sleep', title: 'تنويم البيبي', sub: 'ضوضاء وهدهدة بتايمر' },
    { id: 'log', title: 'رضاعة وحفاضات', sub: 'تسجيل بضغطة واحدة' },
    { id: 'vax', title: 'التطعيمات', sub: 'جدول وزارة الصحة' },
    { id: 'miles', title: 'مراحل النمو', sub: 'شهر بشهر في أول سنة' },
    { id: 'videos', title: 'فيديوهات القناة', sub: 'بيبي مصر على يوتيوب' },
];

function Home({ go, baby, setBaby }: { go: (s: Section) => void; baby: Baby; setBaby: (b: Baby) => void }) {
    const age = ageParts(baby.birth);
    const [edit, setEdit] = useState(false);
    return <div className="bm-home">
        <header className="bm-head">
            <img src={logo} alt="شعار بيبي مصر" width={96} height={96} />
            <h1>بيبي مصر</h1>
            <p dir="ltr" className="bm-en">Baby Masr</p>
            <p className="bm-tag">رفيقة الأم في الليل والنهار</p>
        </header>
        {age && <p className="bm-age">{baby.name ? baby.name + ' عنده ' : 'عمر طفلك '}{n(age.months)} {age.months >= 3 && age.months <= 10 ? 'شهور' : 'شهر'} و{n(age.days)} {age.days >= 3 && age.days <= 10 ? 'أيام' : 'يوم'}</p>}
        <nav className="bm-tiles" aria-label="أقسام التطبيق">
            {TILES.map(t => <button key={t.id} type="button" className="bm-tile" onClick={() => go(t.id)}>
                <span className="bm-ico" aria-hidden="true">{ICONS[t.id]}</span>
                <span><b>{t.title}</b><small>{t.sub}</small></span>
            </button>)}
        </nav>
        <section className="bm-card">
            <button type="button" className="bm-acc-head" aria-expanded={edit} onClick={() => setEdit(!edit)}>
                <span className="bm-acc-title">بيانات الطفل (اختياري)<small>بتساعد في مواعيد التطعيم ومراحل النمو</small></span>
                <span aria-hidden="true" className="bm-chev">{edit ? '▴' : '▾'}</span>
            </button>
            {edit && <div className="bm-form">
                <label>الاسم<input type="text" value={baby.name} maxLength={30} onChange={e => setBaby({ ...baby, name: e.target.value })} /></label>
                <label>تاريخ الميلاد<input type="date" dir="ltr" value={baby.birth} max={new Date().toISOString().slice(0, 10)} onChange={e => setBaby({ ...baby, birth: e.target.value })} /></label>
            </div>}
        </section>
        <Account />
        <p className="bm-foot">{storageWorks() ? 'بياناتك محفوظة على موبايلك، ومش بتتبعت لأي مكان إلا لو سجلتي حساب.' : 'المتصفح ده مش بيسمح بالحفظ على الموبايل. سجلي حساب عشان بياناتك تتحفظ.'} التطبيق ده مش بديل عن دكتور الأطفال. <a href="./privacy.html">سياسة الخصوصية | Privacy</a></p>
    </div>;
}

export function App() {
    const [section, setSection] = useState<Section>('home');
    const [baby, setBaby] = useStore<Baby>('bm.baby.v1', { name: '', birth: '' });
    useEffect(() => { document.documentElement.lang = 'ar'; document.documentElement.dir = 'rtl'; }, []);
    useEffect(() => { document.body.classList.toggle('bm-night-on', section === 'sleep'); }, [section]);
    const back = () => { setSection('home'); window.scrollTo?.(0, 0); };
    const go = (s: Section) => { setSection(s); window.scrollTo?.(0, 0); };
    return <div className="bm-app" dir="rtl" lang="ar">
        {section === 'home' && <Home go={go} baby={baby} setBaby={setBaby} />}
        {section === 'sleep' && <Sleep onBack={back} />}
        {section === 'log' && <Log onBack={back} />}
        {section === 'vax' && <Vax onBack={back} baby={baby} />}
        {section === 'miles' && <Milestones onBack={back} baby={baby} />}
        {section === 'videos' && <Videos onBack={back} />}
    </div>;
}
