import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAEBhJuqHM0rT5efcCwjGB3KSDhbraisic",
  authDomain: "trackimed-feedback.firebaseapp.com",
  databaseURL: "https://trackimed-feedback-default-rtdb.firebaseio.com",
  projectId: "trackimed-feedback",
  storageBucket: "trackimed-feedback.firebasestorage.app",
  messagingSenderId: "422046520208",
  appId: "1:422046520208:web:b9838f74d887206a169915"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
