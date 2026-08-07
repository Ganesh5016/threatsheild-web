import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAMKMicAGt7hNTIBZreqS_Oypj3P8C7ezw",
  authDomain: "threatsheild.firebaseapp.com",
  projectId: "threatsheild",
  storageBucket: "threatsheild.firebasestorage.app",
  messagingSenderId: "1038222342959",
  appId: "1:1038222342959:web:95307167a68c245cbbbfda",
  measurementId: "G-SC0S2NTPPP"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged };
