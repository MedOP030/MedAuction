import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDB9tvd0Whr9kYr3ivsNN1k57UfudvzJE",
  authDomain: "med-auction.firebaseapp.com",
  projectId: "med-auction",
  storageBucket: "med-auction.firebasestorage.app",
  messagingSenderId: "307158810238",
  appId: "1:307158810238:web:b76faf7478d55200e9e22f"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
