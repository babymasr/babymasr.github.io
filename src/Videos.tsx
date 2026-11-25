import React from 'react';
import { Note, Screen } from './common';
import { CHANNEL, VIDEOS } from './data/videos';

export function Videos({ onBack }: { onBack: () => void }) {
    return <Screen title="فيديوهات القناة" onBack={onBack} persist={false}>
        <p className="bm-soft">فيديوهات حسية هادية من قناة بيبي مصر. بتفتح على يوتيوب.</p>
        <a className="bm-btn bm-primary bm-link" href={CHANNEL} target="_blank" rel="noopener noreferrer">افتحي القناة على يوتيوب</a>
        <ul className="bm-videos">
            {VIDEOS.map(v => <li key={v.id}>
                <a href={`https://www.youtube.com/watch?v=${v.id}`} target="_blank" rel="noopener noreferrer">
                    <img src={v.thumb} alt="" width={320} height={180} loading="lazy" />
                    <span><b>{v.title}</b><small dir="ltr">{v.en}</small></span>
                </a>
            </li>)}
        </ul>
        <Note>دي فيديوهات القناة لحد ٢٥ نوفمبر ٢٠٢٦. فيه فيديوهات جديدة على القناة بتنزل.</Note>
    </Screen>;
}
