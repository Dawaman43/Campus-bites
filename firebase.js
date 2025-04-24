// Import Firebase core and services
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // <-- add this

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC0C7E2BAzOuiYAe7eHmy9BoSGoQQ-UtSc",
  authDomain: "campus-bites-a9de0.firebaseapp.com",
  projectId: "campus-bites-a9de0",
  storageBucket: "campus-bites-a9de0.appspot.com", // corrected domain
  messagingSenderId: "266566365189",
  appId: "1:266566365189:web:844c6c7375c0ed4f88ec6c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Auth and Firestore instances
export const auth = getAuth(app);
export const db = getFirestore(app); // <-- export Firestore instance
