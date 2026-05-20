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
 * TIPPS LOCK (3 days before the first game starts)
 * =========================
 */

export const LOCK_TIME = new Date("2026-06-07T23:59:00+02:00");

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

// Sparar eller uppdaterar deltagarens namn i databasen (Säkrad mot överskrivning)
export async function saveUserProfile(user) {
  if (!user) return;

  try {
    const userRef = doc(db, "users", user.uid);
    
    // 🌟 1. LÄS EXISTERANDE DATA FRÅN FLIKEN USERS I FIRESTORE FÖRST
    const userSnap = await getDoc(userRef);
    let nuvarandeNamnIDatabasen = null;

    if (userSnap.exists()) {
      nuvarandeNamnIDatabasen = userSnap.data().displayName;
    }

    // 🌟 2. BESTÄM NAMN UTIFRÅN PRIORITERINGSLISTAN
    // Prio 1: Ett manuellt ändrat namn som redan finns i Firestore-databasen
    // Prio 2: Det displayName som du har gett användaren i Firebase Authentication
    // Prio 3: Din gamla hårdkodade reservlista
    // Prio 4: Fallback till klippt e-postadress (matslindq)
    const namnOrdlista = {
      "NJEOKLuqUUNWjoDMvXrsMAlSFE12": "Joel",
      "v0ZTH8NitNMhEGWRLt35Kkfja4k2": "Staffan",
      "C1EjplNlfuWYJrptDvAAAoYUlII2": "Malin",
      "hjzOSO16LFQy9BqhFcJJOvq9ca33": "Olov",
      "txWfA35EIyRoLyAHpsZOU1VhtNs1": "Mats",
    };

    const bestämNamn = nuvarandeNamnIDatabasen || user.displayName || namnOrdlista[user.uid] || user.email.split("@")[0];

    // 🌟 3. SPARA DET UTVALDA NAMNET (Merge: true ser till att inga andra fält förstörs)
    await setDoc(userRef, {
      displayName: bestämNamn,
      email: user.email,
      updatedAt: serverTimestamp()
    }, { merge: true });

    console.log(`Användarprofil (${bestämNamn}) kontrollerad/sparad i Firestore!`);
  } catch (error) {
    console.error("Kunde inte spara användarprofil till Firestore:", error);
  }
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
 * FIRESTORE: ADMIN / FACIT
 * =========================
 */

export async function loadActualResults() {
  try {
    const ref = doc(db, "admin", "facit");
    const snap = await getDoc(ref);

    if (snap.exists()) {
      return snap.data();
    } else {
      console.warn("Inget facit-dokument hittades i Firestore! Returnerar tomt facit.");
      return {
        roundOf32: [],
        roundOf16: [],
        quarterfinals: [],
        semifinals: [],
        final: [],
        winner: "",
        topScorer: "",
        topScorerGoals: 0
      };
    }
  } catch (error) {
    console.error("Kunde inte hämta facit från Firestore:", error);
    return null;
  }
}

/**
 * =========================
 * DEBUG
 * =========================
 */

console.log("Firebase initialized");
console.log("Current Firebase user:", auth.currentUser);