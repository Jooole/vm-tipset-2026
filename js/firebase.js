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
  getDocs,
  collection,
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
 * INIT (MÅSTE KOMMA FÖRE DB-ANVÄNDNING)
 * =========================
 */

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

/**
 * =========================
 * TIPPS LOCK (1h before the first game starts)
 * =========================
 */

export const LOCK_TIME = new Date("2026-06-08T00:00:01Z");

export function isTipsLocked() {
  return Date.now() >= LOCK_TIME.getTime();
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
 * AUTH FUNCTIONS
 * =========================
 */

export async function register(email, password) {
  return await createUserWithEmailAndPassword(auth, email, password);
}

export async function login(email, password) {
  return await signInWithEmailAndPassword(auth, email, password);
}

export async function logout() {
  return await signOut(auth);
}

/**
 * =========================
 * FIRESTORE: USERS
 * =========================
 */

export async function loadAllUsers() {
  const snapshot = await getDocs(collection(db, "users"));

  return snapshot.docs.map(doc => ({
    userId: doc.id,
    data: doc.data()
  }));
}

/**
 * =========================
 * FIRESTORE: TIPS
 * =========================
 */

export async function saveTips(userId, tipsData) {
  if (!userId) {
    console.error("saveTips: userId saknas");
    return;
  }

  if (isTipsLocked()) {
    console.warn("Tips är låsta – sparande nekas");
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

export async function loadTips(userId) {
  if (!userId) {
    console.error("loadTips: userId saknas");
    return null;
  }

  try {
    const ref = doc(db, "tips", userId);
    const snap = await getDoc(ref);

    return snap.exists() ? snap.data().data : null;
  } catch (error) {
    console.error("Kunde inte hämta tips:", error);
    return null;
  }
}

export async function loadAllTips() {
  try {
    const snapshot = await getDocs(collection(db, "tips"));

    return snapshot.docs.map(doc => ({
      userId: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Kunde inte hämta alla tips:", error);
    return [];
  }
}

/**
 * =========================
 * DEBUG
 * =========================
 */

console.log("Firebase initialized");
console.log("Current Firebase user:", auth.currentUser);