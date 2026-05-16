import {
  onSnapshot,
  collection
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db } from "./firebase.js";

let hasInitialLoad = false;
let lastValidMatches = [];

export function listenToMatches(callback) {

  return onSnapshot(collection(db, "matches"), (snapshot) => {

    const matches = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // 1. VALIDERA TYPE (alltid)
    if (!Array.isArray(matches)) {
      console.warn("Realtime: invalid snapshot");
      return;
    }

    // 2. FIRST LOAD: måste ha data
    if (!hasInitialLoad) {
      hasInitialLoad = true;

      if (matches.length === 0) {
        console.warn("Realtime: first snapshot empty - waiting for data");
        return;
      }

      lastValidMatches = matches;
      callback(matches);
      return;
    }

    // 3. EMPTY SNAPSHOT SKA INTE KROSSA STATE
    if (matches.length === 0) {
      console.warn("Realtime: empty snapshot ignored (keeping last valid state)");
      return;
    }

    // 4. NORMAL UPDATE
    lastValidMatches = matches;
    callback(matches);
  });
}