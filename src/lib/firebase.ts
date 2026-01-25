import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBWFWL1x8d3DDUDl8c5Cc2bSYD9KFkeWck",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "mentoros-app.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "mentoros-app",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "mentoros-app.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "746245767069",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:746245767069:web:7a700546c7c50a2dd4f974"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
