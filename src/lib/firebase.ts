import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: 'AIzaSyCFZfPhvQOcS4nukn_Q0_fAi31Quq1vakY',
    authDomain: 'jameelgc-297ab.firebaseapp.com',
    projectId: 'jameelgc-297ab',
    storageBucket: 'jameelgc-297ab.firebasestorage.app',
    messagingSenderId: '262547977742',
    appId: '1:262547977742:web:9b752843830a1d56102e5f',
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
