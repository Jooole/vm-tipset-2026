import {
  onSnapshot,
  collection
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db } from "./firebase.js";

let hasInitialLoad = false;

export function listenToMatches(callback) {
  return onSnapshot(collection(db, "matches"), (snapshot) => {

    const matches = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // 1. SKYDDA mot första tomma snapshot
    if (!hasInitialLoad) {
      hasInitialLoad = true;

      if (!matches.length) {
        console.warn("Realtime: first snapshot empty - ignoring");
        return;
      }
    }

    // 2. SKYDDA mot efterföljande tomma snapshots
    if (!matches || !Array.isArray(matches)) {
      console.warn("Realtime: invalid snapshot");
      return;
    }

    // 3. Uppdatera bara när vi har riktig data
    callback(matches);
  });
}