import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { initSync } from './sync';
import './style.css';

initSync();
createRoot(document.getElementById('root')!).render(<App />);

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => { navigator.serviceWorker.register('./sw.js').catch(() => {}); });
}
