/**
 * =========================
 * MAIN ENTRY POINT (FIXED)
 * =========================
 */

console.log("App started");

// =========================
// IMPORTS (CLEAN)
// =========================
import { fetchMatches } from "./api.js";
import { initNavigation } from "./ui.js";
import { initCountdown } from "./ui.js";
import { initAuthListener } from "./firebase.js";
import { getFlag } from "./flags.js";
import {
  renderBettingMatches,
  renderAllPlayoffRounds,
  setAllTeams,
  initTopscorerAutocomplete
} from "./betting.js";

// NOTE: players måste komma från players.js
import { players } from "./players.js";

import { initMatchFilters, renderMatches } from "./matches.js";

// =========================
// GLOBAL STATE
// =========================

let hasLoadedMatches = false;
let liveUpdateInterval = null;
let matches = []; // VIKTIGT: saknades i din kod

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

    if (cachedData && cacheAge !== null && cacheAge < CACHE_MAX_AGE) {
      matches = JSON.parse(cachedData);
      renderAllUI(matches);
      return;
    }

    console.log("Fetching from API...");

    const apiMatches = await fetchMatches();

    matches = apiMatches.map(match => ({
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

    localStorage.setItem(CACHE_KEY, JSON.stringify(matches));
    localStorage.setItem(CACHE_TIME_KEY, Date.now());

    renderAllUI(matches);

  } catch (err) {
    console.error("initMatches failed:", err);
  }
}

// =========================
// RENDER UI
// =========================

function getAllTeamsFromMatches(matches) {
  const teams = new Set();

  matches.forEach(m => {
    if (m.homeTeam) teams.add(m.homeTeam);
    if (m.awayTeam) teams.add(m.awayTeam);
  });

  return Array.from(teams).sort();
}

function renderAllUI(matches) {

    renderMatches(matches);

  renderBettingMatches(matches);

  setAllTeams(getAllTeamsFromMatches(matches));

  renderAllPlayoffRounds();

  initTopscorerAutocomplete(players);
}

// =========================
// BOOT
// =========================

initAuthListener((user) => {

  console.log("Auth state:", user);

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  initMatches();
  initMatchFilters();
  initNavigation();
  initCountdown();

});