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
          <div class="score-divider">-</div>
          <input type="number" min="0" placeholder="0">
        </div>

      </div>
    `;
  }).join("");
}


let allTeams = [];

// Sparar valda lag per slutspelsrunda
const playoffSelections = {
  "round-of-32": {},
  "round-of-16": {},
  "quarterfinals": {},
  "semifinals": {},
  "final": {},
  "winner": {}
};

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

  const selections = playoffSelections[containerId] || {};

  let html = `<h4>${title}</h4>`;

  for (let i = 0; i < slots; i++) {

    const selectedTeam = selections[i] || "";

    const availableTeams = allTeams.filter(team => {
      return (
        !Object.values(selections).includes(team) ||
        team === selectedTeam
      );
    });

    html += `
      <select
        class="playoff-select input-base"
        data-round="${containerId}"
        data-slot="${i}"
      >
        <option value="">Välj lag</option>

        ${availableTeams.map(team => `
          <option value="${team}" ${team === selectedTeam ? "selected" : ""}>
            ${team}
          </option>
        `).join("")}

      </select>
    `;
  }

  container.innerHTML = html;

  attachPlayoffListeners();
}

function attachPlayoffListeners() {

  document
    .querySelectorAll(".playoff-section select")
    .forEach(select => {

      select.addEventListener("change", (e) => {

        const round = e.target.dataset.round;
        const slot = e.target.dataset.slot;
        const value = e.target.value;

        // spara valet
        playoffSelections[round][slot] = value;

        // rendera om JUST DENNA runda
        switch (round) {

          case "round-of-32":
            renderPlayoffRound({
              containerId: "round-of-32",
              title: "16-delsfinal",
              slots: 32
            });
            break;

          case "round-of-16":
            renderPlayoffRound({
              containerId: "round-of-16",
              title: "8-delsfinal",
              slots: 16
            });
            break;

          case "quarterfinals":
            renderPlayoffRound({
              containerId: "quarterfinals",
              title: "Kvartsfinal",
              slots: 8
            });
            break;

          case "semifinals":
            renderPlayoffRound({
              containerId: "semifinals",
              title: "Semifinal",
              slots: 4
            });
            break;

          case "final":
            renderPlayoffRound({
              containerId: "final",
              title: "Final",
              slots: 2
            });
            break;

          case "winner":
            renderPlayoffRound({
              containerId: "winner",
              title: "VM-vinnare",
              slots: 1
            });
            break;
        }

      });

    });

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


function initTopscorerAutocomplete() {

  const input =
    document.getElementById("topscorer-input");

  const results =
    document.getElementById("topscorer-results");

  if (!input || !results) return;

  input.addEventListener("input", () => {

    const value =
      input.value.toLowerCase().trim();

    results.innerHTML = "";

    if (!value) return;

    const filteredPlayers = players.filter(player =>
      player.toLowerCase().includes(value)
    );

    filteredPlayers.forEach(player => {

      const option = document.createElement("div");

      option.textContent = player;

      option.addEventListener("click", () => {
        input.value = player;
        results.innerHTML = "";
      });

      results.appendChild(option);

    });

  });

}