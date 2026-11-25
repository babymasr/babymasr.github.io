# Baby Masr | بيبي مصر

Mobile PWA for Egyptian moms: sleep sounds + timer, feeding/diaper log, Ministry of Health vaccine schedule, milestones, channel videos.
Arabic RTL, dark theme. Works offline, installable, optional login with sync (Firebase free plan).

دليل التعديل بالعربي للمبتدئين: [README-AR.md](README-AR.md)

Live: https://babymasr.github.io/

## Develop
```
npm install
npm run dev      # local dev server
npm run build    # outputs dist/
```
Pushing to `main` builds and deploys to GitHub Pages automatically (`.github/workflows/deploy.yml`).

## Structure
- `src/` React + TypeScript app. `src/data/` holds vaccines, milestones, videos.
- `src/storage.ts` local-first storage (localStorage). `src/sync.ts` + `src/firebase.ts` sync to Firestore when signed in.
- `src/firebase-config.ts` Firebase web config (public by design). `firestore.rules` limits each user to their own document.
- `public/` manifest, service worker (`sw.js`, bump `VERSION` on release), icons, `privacy.html`.

## Backend
Firebase project `baby-masr` (Spark, free): Authentication (email/password, Google), Firestore `users/{uid}`.
Deploy rule changes with the Firebase console (Firestore > Rules) or `firebase deploy --only firestore:rules`.
