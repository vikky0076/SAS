// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyApDxkTe7g2-9tdP9rstD2XhVC5UQNtb8s",
  authDomain: "smart-attendance-system-83712.firebaseapp.com",
  projectId: "smart-attendance-system-83712",
  storageBucket: "smart-attendance-system-83712.firebasestorage.app",
  messagingSenderId: "331080688001",
  appId: "1:331080688001:web:88b98f1d63c98d91aac880"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and Cloud Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);
