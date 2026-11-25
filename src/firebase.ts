import { initializeApp } from 'firebase/app';
import { GoogleAuthProvider, createUserWithEmailAndPassword, getAuth, onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup, signOut, type User } from 'firebase/auth';
import { doc, getDoc, getFirestore, onSnapshot, setDoc } from 'firebase/firestore';
import { firebaseConfig } from './firebase-config';

const app = initializeApp(firebaseConfig!);
const auth = getAuth(app);
auth.languageCode = 'ar';
const db = getFirestore(app);

export const watchAuth = (cb: (u: User | null) => void) => onAuthStateChanged(auth, cb);
export const signUp = (e: string, p: string) => createUserWithEmailAndPassword(auth, e, p);
export const signIn = (e: string, p: string) => signInWithEmailAndPassword(auth, e, p);
export const signInGoogle = () => signInWithPopup(auth, new GoogleAuthProvider());
export const resetPw = (e: string) => sendPasswordResetEmail(auth, e);
export const signOutNow = () => signOut(auth);
export const saveDoc = (uid: string, d: unknown) => setDoc(doc(db, 'users', uid), { ...(d as object), updatedAt: Date.now() });
export const loadDoc = async (uid: string) => { const s = await getDoc(doc(db, 'users', uid)); return s.exists() ? s.data() : null; };
export const listenDoc = (uid: string, cb: (d: unknown) => void) => onSnapshot(doc(db, 'users', uid), s => cb(s.exists() ? s.data() : null));
