/**
 * =========================
 * MATCHES MODULE
 * =========================
 * Ansvar:
 * - Håller appens match-state (matches array)
 * - Filtrering (grupp / datum)
 * - Rendering av match-listor
 * - Logik för matchvisning i UI
 */

let matches = [];
let todaysMatchesOnly = false;
let activeGroup = "Alla grupper";

export function renderMatches(data) {
    matches = data;
  const matchesList = document.getElementById("matches-list");
  if (!matchesList) return;

  matchesList.innerHTML = data.map(match => {
    const homeTeam = match.homeTeam || "Ännu inte avgjort";
    const awayTeam = match.awayTeam || "Ännu inte avgjort";

    const homeEmpty = match.homeScore == null;
    const awayEmpty = match.awayScore == null;

    return `
      <div class="match-item ${match.status === "live" ? "live-match" : ""}">

        <div class="match-top">
          <div class="match-date">
            <span>📅</span>
            <span>${match.date}</span>
            <span>${match.time}</span>
          </div>

          <div class="match-status ${match.status}">
            ${
              match.status === "finished"
                ? "Avslutad"
                : match.status === "live"
                ? "🔴 Live"
                : "Kommande"
            }
          </div>
        </div>

        <div class="match-center">

          <div class="team">
            <span class="team-name">${homeTeam}</span>
            ${match.homeFlag
             ? `<img class="flag" src="${match.homeFlag}" />`
                : ""
            } </div>

          <div class="score-box ${homeEmpty ? "empty" : ""}">
            ${match.homeScore ?? ""}
          </div>

          <div class="score-divider">
            ${homeEmpty ? "-" : ":"}
          </div>

          <div class="score-box ${awayEmpty ? "empty" : ""}">
            ${match.awayScore ?? ""}
          </div>

          <div class="team">
            ${match.awayFlag
            ? `<img class="flag" src="${match.awayFlag}" />`
            : ""
            }
            <span class="team-name">${awayTeam}</span>
          </div>

        </div>

        <div class="match-bottom">
          <span>${match.group}</span>
          <span>${match.stadium}</span>
        </div>

      </div>
    `;
  }).join("");
}

function filterMatches() {
  let filtered = [...matches];

  if (activeGroup !== "Alla grupper") {
    filtered = filtered.filter(m => m.group === activeGroup);
  }

  if (todaysMatchesOnly) {
    const today = new Date().toISOString().split("T")[0];
    filtered = filtered.filter(m => m.date === today);
  }

  renderMatches(filtered);
}

export function initMatchFilters() {
  const todayToggle = document.getElementById("today-toggle");
  const groupSelect = document.getElementById("group-select");

  todayToggle?.addEventListener("change", () => {
    todaysMatchesOnly = todayToggle.checked;
    filterMatches();
  });

  groupSelect?.addEventListener("change", () => {
    activeGroup = groupSelect.value;
    filterMatches();
  });
}

//Bygger lista av alla lag
function getAllTeamsFromMatches(matches) {
  const teams = new Set();

  matches.forEach(m => {
    if (m.homeTeam) teams.add(m.homeTeam);
    if (m.awayTeam) teams.add(m.awayTeam);
  });

  return Array.from(teams).sort();
}