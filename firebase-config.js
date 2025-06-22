import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCR6lf41OC9NOG04PW0b_IQvjDn1qB-F5E",
  authDomain: "modern-ludo.firebaseapp.com",
  databaseURL: "https://modern-ludo-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "modern-ludo",
  storageBucket: "modern-ludo.appspot.com",
  messagingSenderId: "618376946712",
  appId: "1:618376946712:web:a8aac0bccec95f864a8f6d"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db, ref, set, onValue };
