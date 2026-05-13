console.log("App started");

async function initMatches() {
  console.log("Loading API...");

  const apiMatches = await fetchMatches();

  if (!Array.isArray(apiMatches)) {
    console.error("API error:", apiMatches);
    return;
  }

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

  renderMatches(matches);
}

initMatches();
initMatchFilters();
initNavigation();
initCountdown();