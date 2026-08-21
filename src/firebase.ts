import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
// Keep any other imports you already have here, like firestore!

const firebaseConfig = {
  apiKey: "AIzaSyAHQdhqjSDgC2Gim6E4iyPo5pVg9Ylay0U",
  authDomain: "nass-lasu-website.firebaseapp.com",
  projectId: "nass-lasu-website",
  storageBucket: "nass-lasu-website.firebasestorage.app",
  messagingSenderId: "266888871449",
  appId: "1:266888871449:web:ba6f07ef1926d137ec7488",
  measurementId: "G-H48ECFXWPQ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);
// Keep any other exports you already have here, like export const db = getFirestore(app);
  
  
