/**
 * =========================
 * FIREBASE INIT
 * =========================
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBlXP1-QoC1apossZ9cUYka5RZuV4q9rL0",
  authDomain: "vm-tipset-2026.firebaseapp.com",
  projectId: "vm-tipset-2026",
  appId: "1:421747505021:web:9367cd8dbd5544a1bbbe14"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

/**
 * =========================
 * AUTH FUNCTIONS
 * =========================
 */

export async function register(email, password) {
  return await createUserWithEmailAndPassword(auth, email, password);
}

export async function login(email, password) {
  return await signInWithEmailAndPassword(auth, email, password);
}

/**
 * =========================
 * AUTH STATE LISTENER
 * =========================
 */

export function initAuthListener(callback) {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("Inloggad som:", user.email);
      window.currentUser = user;
    } else {
      console.log("Inte inloggad");
      window.currentUser = null;
    }

    if (callback) callback(user);
  });
}