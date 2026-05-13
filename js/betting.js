/**
 * =========================
 * BETTING MODULE
 * =========================
 * Ansvar:
 * - Renderar sidan "Min tippning"
 * - Visar alla gruppspelsmatcher från API-data
 * - Hanterar inputs för hemmalag/bortalag (score-tips)
 *
 * Kommande funktioner (framtid):
 * - Spara tippningar (localStorage)
 * - Koppla tippning till specifika matcher (match-id)
 * - Återläsa sparade tippningar vid sidladdning
 *
 * Viktigt:
 * - Ingen API-logik här
 * - Ingen navigation eller UI för andra sidor
 * - Använder global "matches"-array från matches.js
 */

function renderBettingMatches(matches) {
  const container = document.getElementById("match-list");
  if (!container) return;

  // bara gruppspel
  const groupMatches = matches.filter(m =>
    m.group.startsWith("Grupp")
  );

  container.innerHTML = groupMatches.map(match => {
    const homeTeam = match.homeTeam || "TBD";
    const awayTeam = match.awayTeam || "TBD";

    return `
      <div class="match-card">

        <span>
          ${homeTeam} - ${awayTeam}
        </span>

        <div class="score-inputs">
          <input type="number" min="0" placeholder="0">
          <input type="number" min="0" placeholder="0">
        </div>

      </div>
    `;
  }).join("");
}



let allTeams = [];

function setAllTeams(teams) {
  allTeams = teams;
}

function renderPlayoffRound({
  containerId,
  title,
  slots
}) {

  const container = document.getElementById(containerId);

  if (!container) return;

  let html = `<h3>${title}</h3>`;

  for (let i = 0; i < slots; i++) {

    html += `
      <select>
        <option value="">Välj lag</option>

        ${allTeams.map(team => `
          <option value="${team}">
            ${team}
          </option>
        `).join("")}

      </select>
    `;
  }

  container.innerHTML = html;
}

function renderAllPlayoffRounds() {

  renderPlayoffRound({
    containerId: "round-of-32",
    title: "16-delsfinal",
    slots: 32
  });

  renderPlayoffRound({
    containerId: "round-of-16",
    title: "8-delsfinal",
    slots: 16
  });

  renderPlayoffRound({
    containerId: "quarterfinals",
    title: "Kvartsfinal",
    slots: 8
  });

  renderPlayoffRound({
    containerId: "semifinals",
    title: "Semifinal",
    slots: 4
  });

  renderPlayoffRound({
    containerId: "final",
    title: "Final",
    slots: 2
  });

  renderPlayoffRound({
    containerId: "winner",
    title: "VM-vinnare",
    slots: 1
  });

}
