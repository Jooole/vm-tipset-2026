/**
 * =========================
 * MAIN ENTRY POINT (FIXED)
 * =========================
 */

console.log("App started");

// =========================
// IMPORTS
// =========================
import { loadTips, loadAllTips } from "./firebase.js";
import { calculateUserPoints } from "./results.js";
import { fetchMatches } from "./api.js";
import { initNavigation } from "./ui.js";
import { initCountdown } from "./ui.js";
import {
  initAuthListener,
  isTipsLocked
} from "./firebase.js";
import { getFlag } from "./flags.js";
import { loadAllUsers } from "./firebase.js";
import { actualResults } from "./results.js";
import { listenToMatches } from "./realtime.js";

import {
  renderBettingMatches,
  renderAllPlayoffRounds,
  setAllTeams,
  initTopscorerAutocomplete,
  hydrateBettingUI
} from "./betting.js";

import { players } from "./players.js";
import { initMatchFilters, renderMatches } from "./matches.js";

// =========================
// GLOBAL STATE
// =========================

const DEV_MODE = true;

function isLockedForUI() {
  if (DEV_MODE) return false; // 👈 viktig: alltid olåst i dev
  return isTipsLocked();
}

let hasLoadedMatches = false;
let liveUpdateInterval = null;
let previousLeaderboard = [];

window.matches = [];
window.allTips = [];
window.userTips = {};

function applyMatchUpdates(baseMatches, updates) {
  return baseMatches.map(match => {
    const override = updates.find(u => u.id === match.id);

    if (!override) return match;

    return {
      ...match,
      ...override
    };
  });
}

// =========================
// INIT MATCHES
// =========================
async function initMatches() {
  if (hasLoadedMatches) return;
  hasLoadedMatches = true;

  const CACHE_KEY = "matches_cache";
  const CACHE_TIME_KEY = "matches_cache_time";
  const CACHE_MAX_AGE = 10 * 60 * 1000;

  try {
    console.log("Loading matches...");

    const cachedData = localStorage.getItem(CACHE_KEY);
    const cachedTime = localStorage.getItem(CACHE_TIME_KEY);

    const now = Date.now();
    const cacheAge = cachedTime ? now - Number(cachedTime) : null;

    // =========================
    // USE CACHE
    // =========================
    if (cachedData && cacheAge !== null && cacheAge < CACHE_MAX_AGE) {
      window.matches = JSON.parse(cachedData);
console.log("DEBUG matches before render:", window.matches);
renderAllUI(window.matches);
console.log("DEBUG after renderAllUI");      return;
    }

    // =========================
    // FETCH FROM API
    // =========================
    console.log("Fetching from API...");

    const apiMatches = await fetchMatches();

    window.matches = apiMatches.map(match => ({
      id: match.id,

      date: match.kickoff_utc?.split("T")[0] ?? "",
      time: new Date(match.kickoff_utc).toLocaleTimeString("sv-SE", {
        hour: "2-digit",
        minute: "2-digit"
      }),

      group: match.group_name ? `Grupp ${match.group_name}` : "Slutspel",

      homeTeam: match.home_team,
      awayTeam: match.away_team,

      homeFlag: getFlag(match.home_team_code),
      awayFlag: getFlag(match.away_team_code),

      homeScore: match.home_score ?? null,
      awayScore: match.away_score ?? null,

      stadium: match.stadium ?? "",

      status:
        match.status === "completed"
          ? "finished"
          : match.status === "live"
          ? "live"
          : "upcoming"
    }));

    // cache fix
    localStorage.setItem(CACHE_KEY, JSON.stringify(window.matches));
    localStorage.setItem(CACHE_TIME_KEY, Date.now());

    renderAllUI(window.matches);

  } catch (err) {
    console.error("initMatches failed:", err);
  }
}

// =========================
// RENDER ALL UI
// =========================
function renderAllUI(matches) {
  window.matches = matches;

  renderMatches(matches);
  renderBettingMatches(matches);

  setAllTeams(getAllTeamsFromMatches(matches));
  renderAllPlayoffRounds();

  initTopscorerAutocomplete(players);
  hydrateBettingUI();

  // leaderboard måste köras EFTER all data finns
  renderLeaderboard();
  
}

// =========================
// TEAMS HELPERS
// =========================
function getAllTeamsFromMatches(matches) {
  const teams = new Set();

  matches.forEach(m => {
    if (m.homeTeam) teams.add(m.homeTeam);
    if (m.awayTeam) teams.add(m.awayTeam);
  });

  return Array.from(teams).sort();
}

// =========================
// LEADERBOARD
// =========================
async function renderLeaderboard() {
  const tableBody = document.getElementById("leaderboard-body");
  if (!tableBody) return;

  const [allUsers, allTips] = await Promise.all([
    loadAllUsers(),
    loadAllTips()
  ]);

  const leaderboard = allUsers.map(user => {

    const tipsEntry = allTips.find(
      t => t.userId === user.userId
    );

    const userTips = tipsEntry?.data || {};

    const points = calculateUserPoints({
      userTips,
      matches: window.matches,
      actualResults
    });

    return {
      userId: user.userId,
      name: user.data?.displayName || user.userId,
      points
    };
  });

  leaderboard.sort((a, b) => b.points - a.points);
const leaderboardWithDelta = leaderboard.map((user, index) => {

  const prevIndex = previousLeaderboard.findIndex(
    u => u.userId === user.userId
  );

  let change = 0;

  if (prevIndex !== -1) {
    change = prevIndex - index;
  }

  return {
    ...user,
    rank: index + 1,
    change
  };
});
  tableBody.innerHTML = leaderboardWithDelta.map(user => {

  const arrow =
    user.change > 0 ? "↑" :
    user.change < 0 ? "↓" : "–";

  const changeClass =
    user.change > 0 ? "up" :
    user.change < 0 ? "down" : "stable";

  return `
    <tr>
      <td>${user.rank}</td>
      <td>
        ${user.name}
        <span class="rank-change ${changeClass}">
  ${arrow} ${user.change !== 0 ? Math.abs(user.change) : ""}
</span>
      </td>
      <td>${user.points}</td>
    </tr>
  `;
}).join("");
previousLeaderboard = leaderboard;
}

// =========================
// LOCK BETTING UI
// =========================
function lockBettingUI() {

  if (!isLockedForUI()) return;

  console.log("Tips are locked");

  // disable alla inputs
  document.querySelectorAll(".betting-input")
    .forEach(el => {
      el.disabled = true;
    });
}

// =========================
// BOOT
// =========================
initAuthListener(async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  console.log("Loading user tips...");

  // 1. LOAD MATCHES FIRST
  await initMatches();

  // 2. LOAD USER DATA
  const savedTips = await loadTips(user.uid) || {};
  window.allTips = await loadAllTips();

  window.userTips = {
    matches: {},
    playoffs: {},
    topScorer: "",
    goals: 0,
    ...savedTips
  };

  console.log("State ready");

  // 3. INIT UI
  console.log("INITING MATCH FILTERS");

  initMatchFilters();
  initNavigation();
  initCountdown();
  lockBettingUI();
  
 // 4. REALTIME UPDATES
listenToMatches((updates) => {
  console.log("Matches updated in realtime");

  if (!window.matches || window.matches.length === 0) {
    console.warn("Realtime ignored - no base matches yet");
    return;
  }

  const merged = applyMatchUpdates(window.matches, updates);

  window.matches = merged;

  // ONLY update match UI (no full re-render)
  renderMatches(window.matches);
  renderBettingMatches(window.matches);
});
});

// =========================
// DEV MODE (FOR TESTING)
// =========================
if (DEV_MODE) {

  window.devSimulateResult = function (matchId, homeScore, awayScore) {

    console.log("DEV: simulating result", matchId);

    const update = [{
      id: matchId,
      home_score: homeScore,
      away_score: awayScore,
      status: "completed"
    }];

    const merged = applyMatchUpdates(window.matches, update);

    window.matches = merged;

    renderMatches(window.matches);
    renderBettingMatches(window.matches);
    renderLeaderboard();
  };

}