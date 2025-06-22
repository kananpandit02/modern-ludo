// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  onValue
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// ✅ Your actual Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCR6lf41OC9NOG04PW0b_IQvjDn1qB-F5E",
  authDomain: "modern-ludo.firebaseapp.com",
  databaseURL: "https://modern-ludo-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "modern-ludo",
  storageBucket: "modern-ludo.firebasestorage.app",
  messagingSenderId: "618376946712",
  appId: "1:618376946712:web:a8aac0bccec95f864a8f6d"
};

// ✅ Initialize Firebase app
const app = initializeApp(firebaseConfig);

// ✅ Connect to Realtime Database
const db = getDatabase(app);

// ✅ Export to use in your game logic
export { db, ref, set, onValue };
