import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAYAqryxjkQiCh1Ot5RROTDXLp7oBerppc",
  authDomain: "d-personal-vault.firebaseapp.com",
  projectId: "d-personal-vault",
  storageBucket: "d-personal-vault.firebasestorage.app",
  messagingSenderId: "295071286782",
  appId: "1:295071286782:web:96b75eebf7abc5528c2caf",
  measurementId: "G-TYXNBHCZ46"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
