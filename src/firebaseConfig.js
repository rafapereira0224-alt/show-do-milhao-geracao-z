import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCoAjNpWDp29erxrp4QmefARzlyDz0p0T0",
  authDomain: "show-milhao-geracao-z.firebaseapp.com",
  projectId: "show-milhao-geracao-z",
  storageBucket: "show-milhao-geracao-z.firebasestorage.app",
  messagingSenderId: "856530043493",
  appId: "1:856530043493:web:fe9a0d52ceef4c11cf3c8c",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);