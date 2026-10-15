import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDB9tvd0Whr9kYr3ivsNN1k57UfudvzoJE",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "med-auction.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "med-auction",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "med-auction.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "307158810238",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:307158810238:web:b76faf7478d55200e9e22f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
