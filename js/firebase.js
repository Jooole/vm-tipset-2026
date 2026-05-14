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
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/**
 * =========================
 * CONFIG
 * =========================
 */

const firebaseConfig = {
  apiKey: "AIzaSyBlXP1-QoC1apossZ9cUYka5RZuV4q9rL0",
  authDomain: "vm-tipset-2026.firebaseapp.com",
  projectId: "vm-tipset-2026",
  appId: "1:421747505021:web:9367cd8dbd5544a1bbbe14"
};

/**
 * =========================
 * INIT
 * =========================
 */

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

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
 * AUTH STATE
 * =========================
 */

export function initAuthListener(callback) {
  onAuthStateChanged(auth, (user) => {
    window.currentUser = user;

    if (callback) callback(user);
  });
}

/**
 * =========================
 * FIRESTORE: SAVE TIPS
 * =========================
 */

export async function saveTips(userId, tipsData) {
  if (!userId) {
    console.error("saveTips: userId saknas");
    return;
  }

  try {
    await setDoc(doc(db, "tips", userId), {
      data: tipsData,
      updatedAt: serverTimestamp()
    });

    console.log("Tips sparade!");
  } catch (error) {
    console.error("Kunde inte spara tips:", error);
  }
}

/**
 * =========================
 * FIRESTORE: LOAD TIPS
 * =========================
 */

export async function loadTips(userId) {
  if (!userId) {
    console.error("loadTips: userId saknas");
    return null;
  }

  try {
    const ref = doc(db, "tips", userId);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      return snap.data().data;
    }

    return null;
  } catch (error) {
    console.error("Kunde inte hämta tips:", error);
    return null;
  }
}

/**
 * =========================
 * LOG OUT
 * =========================
 */

export async function logout() {
  await signOut(auth);
}

/**
 * =========================
 * DEBUG
 * =========================
 */

console.log("Firebase initialized");
console.log("Current Firebase user:", auth.currentUser);