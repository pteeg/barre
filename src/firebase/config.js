// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB8WwoGis2uGg5Ft3ZI-JKlxg9lWYgzWDM",
  authDomain: "barre-2e5f4.firebaseapp.com",
  projectId: "barre-2e5f4",
  storageBucket: "barre-2e5f4.firebasestorage.app",
  messagingSenderId: "906434917060",
  appId: "1:906434917060:web:b8b17410999b7d8c6f8f91",
  measurementId: "G-0NDYFGZPKH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { app, analytics, db };
