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

let todaysMatchesOnly = false;
let activeGroup = "Alla grupper";

export function renderMatches(data) {
    console.log("FIRST MATCH:", data[0]);
if (!Array.isArray(data)) {
    console.warn("renderMatches blocked invalid data:", data);
    return;
  }

  if (!Array.isArray(data)) {
  console.warn("renderMatches blocked invalid data:", data);
  return;
}
  const matchesList = document.getElementById("matches-list");
  console.log("DEBUG matchesList element:", matchesList);
console.log("DEBUG render input:", data.length);
  if (!matchesList) return;

  const html = data.map(match => {
    const homeTeam = match.homeTeam || "Ännu inte avgjort";
    const awayTeam = match.awayTeam || "Ännu inte avgjort";

    const homeEmpty = match.homeScore == null;
    const awayEmpty = match.awayScore == null;

    return `
  <div class="match-item ${match.status === "live" ? "live-match" : ""}" data-match-id="${match.id || ""}">
    
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
        <span class="team-name">${match.homeTeam}</span>
        ${match.homeFlag ? `<img class="flag" src="${match.homeFlag}" />` : ""}
      </div>

      <div class="score-box">
        ${match.homeScore ?? ""}
      </div>

      <div class="score-divider">:</div>

      <div class="score-box">
        ${match.awayScore ?? ""}
      </div>

      <div class="team">
        ${match.awayFlag ? `<img class="flag" src="${match.awayFlag}" />` : ""}
        <span class="team-name">${match.awayTeam}</span>
      </div>

    </div>

    <div class="match-bottom">
      <span>${match.group}</span>
      <span>${match.stadium}</span>
    </div>

  </div>
`;
  }).join("");
  matchesList.innerHTML = html;
console.log("RENDERED MATCHES COUNT:", data.length);
}

function filterMatches() {
      console.log("FILTER TRIGGERED");
  let filtered = [...window.matches];
  
  console.log("ACTIVE GROUP:", activeGroup);
  console.log("AVAILABLE GROUPS:", window.matches.map(m => m.group));

  if (activeGroup !== "Alla grupper") {
filtered = filtered.filter(m =>
  m.group?.trim().toLowerCase() === activeGroup?.trim().toLowerCase()
);  }

  if (todaysMatchesOnly) {
    const today = new Date().toISOString().split("T")[0];
    filtered = filtered.filter(m => m.date === today);
  }
    
  console.log("FILTERED RESULT:", filtered.length);

  renderMatches(filtered);
}

export function initMatchFilters() {
  const todayToggle = document.getElementById("today-toggle");
  const groupSelect = document.querySelector(".group-select");
  
  todayToggle?.addEventListener("change", () => {
    todaysMatchesOnly = todayToggle.checked;
    filterMatches();
  });

  groupSelect?.addEventListener("change", () => {
      console.log("GROUP SELECT CHANGED:", groupSelect.value);

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