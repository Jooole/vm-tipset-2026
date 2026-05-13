/**
 * =========================
 * MAIN ENTRY POINT
 * =========================
 *
 * Ansvar:
 * - Startar hela applikationen
 * - Hämtar matcher från API eller cache
 * - Renderar UI (matcher + betting + playoff)
 * - Hanterar live polling vid behov
 *
 * Detta är appens "controller"
 */

console.log("App started");

// =========================
// GLOBAL STATE
// =========================

// skyddar mot dubbel init
let hasLoadedMatches = false;

// interval för live updates
let liveUpdateInterval = null;

/**
 * Kollar om någon match är live
 */
function hasLiveMatches(matchList) {
  return matchList.some(m => m.status === "live");
}

// =========================
// MAIN INIT FUNCTION
// =========================

async function initMatches() {
  if (hasLoadedMatches) {
    console.warn("initMatches blocked (already executed)");
    return;
  }

  hasLoadedMatches = true;

  // cache config
  const CACHE_KEY = "matches_cache";
  const CACHE_TIME_KEY = "matches_cache_time";
  const CACHE_MAX_AGE = 10 * 60 * 1000; // 10 min

  try {
    console.log("Loading matches...");

    // =========================
    // 1. TRY CACHE FIRST
    // =========================
    const cachedData = localStorage.getItem(CACHE_KEY);
    const cachedTime = localStorage.getItem(CACHE_TIME_KEY);

    const now = Date.now();
    const cacheAge = cachedTime ? now - Number(cachedTime) : null;

    if (cachedData && cacheAge !== null && cacheAge < CACHE_MAX_AGE) {
      console.log("Using CACHE (age min):", Math.round(cacheAge / 60000));

      matches = JSON.parse(cachedData);

      renderAllUI(matches);

      return; // stop → ingen API call
    }

    // =========================
    // 2. FETCH API
    // =========================
    console.log("Fetching from API...");

    const apiMatches = await fetchMatches();

    if (!Array.isArray(apiMatches)) {
      console.error("API error:", apiMatches);
      return;
    }

    // =========================
    // 3. MAP API DATA
    // =========================
    matches = apiMatches.map(match => ({
      date: match.kickoff_utc?.split("T")[0] ?? "",

      time: new Date(match.kickoff_utc).toLocaleTimeString("sv-SE", {
        hour: "2-digit",
        minute: "2-digit"
      }),

      group: match.group_name
        ? `Grupp ${match.group_name}`
        : "Slutspel",

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

    // =========================
    // 4. SAVE CACHE
    // =========================
    localStorage.setItem(CACHE_KEY, JSON.stringify(matches));
    localStorage.setItem(CACHE_TIME_KEY, Date.now());

    // =========================
    // 5. RENDER UI
    // =========================
    renderAllUI(matches);

    console.log("initMatches complete:", {
      matches: matches.length
    });

    // =========================
    // 6. START LIVE POLLING IF NEEDED
    // =========================
    if (hasLiveMatches(matches)) {
      startLivePolling();
    } else {
      console.log("No live matches → polling disabled");
    }

  } catch (err) {
    console.error("initMatches failed:", err);
  }
}

// =========================
// LIVE POLLING
// =========================

function startLivePolling() {
  if (liveUpdateInterval) return;

  console.log("Live polling started (10 min interval)");

  liveUpdateInterval = setInterval(async () => {
    try {
      console.log("Live update fetch...");

      const apiMatches = await fetchMatches();

      if (!Array.isArray(apiMatches)) return;

      matches = apiMatches.map(match => ({
        date: match.kickoff_utc?.split("T")[0] ?? "",

        time: new Date(match.kickoff_utc).toLocaleTimeString("sv-SE", {
          hour: "2-digit",
          minute: "2-digit"
        }),

        group: match.group_name
          ? `Grupp ${match.group_name}`
          : "Slutspel",

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

      // update cache
      localStorage.setItem("matches_cache", JSON.stringify(matches));
      localStorage.setItem("matches_cache_time", Date.now());

      // update UI
      renderAllUI(matches);

      console.log("Live update complete");

    } catch (err) {
      console.error("Live polling error:", err);
    }
  }, 10 * 60 * 1000);
}

// =========================
// UI HELPER (EN enda render-funktion)
// =========================

function renderAllUI(matches) {
  renderMatches(matches);

  if (typeof renderBettingMatches === "function") {
    renderBettingMatches(matches);
  }

  const teams = getAllTeamsFromMatches(matches);

  if (typeof setAllTeams === "function") {
    setAllTeams(teams);
  }

 if (typeof renderAllPlayoffRounds === "function") {
  renderAllPlayoffRounds();
}
}

// =========================
// BOOT APP
// =========================

initMatches();
initMatchFilters();
initNavigation();
initCountdown();
initTopscorerAutocomplete();