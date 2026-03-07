// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBzV6gz7-mRTjWyrej179-oMNOUk5CAC0A",
  authDomain: "frc-attendance.firebaseapp.com",
  projectId: "frc-attendance",
  storageBucket: "frc-attendance.firebasestorage.app",
  messagingSenderId: "575685594272",
  appId: "1:575685594272:web:6ab4b53cfa0ad7b3540dc5",
  measurementId: "G-GT8QHJ41SN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export { app };
export const db = getFirestore(app);
export const auth = getAuth(app);