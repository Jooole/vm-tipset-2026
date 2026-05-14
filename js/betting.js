/**
 * =========================
 * BETTING MODULE (FIXED)
 * =========================
 */

import { saveTips } from "./firebase.js";

/**
 * =========================
 * STATE
 * =========================
 */

let tipsState = {
  matches: {},
  playoffs: {},
  topScorer: "",
  goals: 0
};

let allTeams = [];

const playoffSelections = {
  "round-of-32": {},
  "round-of-16": {},
  "quarterfinals": {},
  "semifinals": {},
  "final": {},
  "winner": {}
};

let saveTimeout;

/**
 * =========================
 * AUTO SAVE (SAFE CLONE)
 * =========================
 */

function autoSave() {
  clearTimeout(saveTimeout);

  saveTimeout = setTimeout(() => {
    if (!window.currentUser) return;

    const payload = structuredClone
      ? structuredClone(tipsState)
      : JSON.parse(JSON.stringify(tipsState));

    saveTips(window.currentUser.uid, payload);
  }, 500);
}

/**
 * =========================
 * MATCH RENDER
 * =========================
 */

 function renderBettingMatches(matches) {
  const container = document.getElementById("match-list");
  if (!container) return;

  const groupMatches = matches.filter(m =>
    m.group?.startsWith("Grupp")
  );

  container.innerHTML = groupMatches.map((match, index) => {

    const homeTeam = match.homeTeam || "TBD";
    const awayTeam = match.awayTeam || "TBD";

    const matchId = match.id || `${homeTeam}-${awayTeam}-${index}`;

    return `
      <div class="match-card" data-id="${matchId}">

        <span>${homeTeam} - ${awayTeam}</span>

        <div class="score-inputs">
          <input type="number" min="0" class="home-score">
          <div class="score-divider">-</div>
          <input type="number" min="0" class="away-score">
        </div>

      </div>
    `;
  }).join("");

  bindMatchInputs(); // 👈 IMPORTANT: bind efter render
}

/**
 * =========================
 * MATCH INPUTS (SAFE BIND)
 * =========================
 */

function bindMatchInputs() {
  document.querySelectorAll(".match-card").forEach(card => {

    const inputs = card.querySelectorAll("input");
    if (!inputs.length) return;

    inputs.forEach(input => {
      input.oninput = () => {

        const matchId = card.dataset.id;
        if (!matchId) return;

        tipsState.matches[matchId] = {
          home: inputs[0].value,
          away: inputs[1].value
        };

        autoSave();
      };
    });
  });
}

/**
 * =========================
 * PLAYOFF
 * =========================
 */

function setAllTeams(teams) {
  allTeams = teams;
}

function renderPlayoffRound({ containerId, title, slots }) {

  const container = document.getElementById(containerId);
  if (!container) return;

  const selections = playoffSelections[containerId] || {};

  let html = `<h4>${title}</h4>`;

  for (let i = 0; i < slots; i++) {

    const selectedTeam = selections[i] || "";

    const availableTeams = allTeams.filter(team =>
      !Object.values(selections).includes(team) ||
      team === selectedTeam
    );

    html += `
      <select class="playoff-select input-base"
        data-round="${containerId}"
        data-slot="${i}">
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
}

/**
 * =========================
 * PLAYOFF LISTENERS (NO DUPLICATES)
 * =========================
 */

let listenersBound = false;

function attachPlayoffListeners() {
  if (listenersBound) return;
  listenersBound = true;

  document.addEventListener("change", (e) => {

    if (!e.target.matches(".playoff-select")) return;

    const round = e.target.dataset.round;
    const slot = e.target.dataset.slot;
    const value = e.target.value;

    playoffSelections[round][slot] = value;

    tipsState.playoffs = structuredClone
      ? structuredClone(playoffSelections)
      : JSON.parse(JSON.stringify(playoffSelections));

    autoSave();

    renderPlayoffRoundById(round);
  });
}

/**
 * =========================
 * RERENDER ONE ROUND
 * =========================
 */

function renderPlayoffRoundById(round) {

  const config = {
    "round-of-32": { title: "16-delsfinal", slots: 32 },
    "round-of-16": { title: "8-delsfinal", slots: 16 },
    "quarterfinals": { title: "Kvartsfinal", slots: 8 },
    "semifinals": { title: "Semifinal", slots: 4 },
    "final": { title: "Final", slots: 2 },
    "winner": { title: "VM-vinnare", slots: 1 }
  }[round];

  if (!config) return;

  renderPlayoffRound({
    containerId: round,
    title: config.title,
    slots: config.slots
  });
}

/**
 * =========================
 * INIT PLAYOFFS
 * =========================
 */

function renderAllPlayoffRounds() {

  renderPlayoffRoundById("round-of-32");
  renderPlayoffRoundById("round-of-16");
  renderPlayoffRoundById("quarterfinals");
  renderPlayoffRoundById("semifinals");
  renderPlayoffRoundById("final");
  renderPlayoffRoundById("winner");

  attachPlayoffListeners();
}

/**
 * =========================
 * SKYTTELIGA AUTOCOMPLETE
 * =========================
 */

function initTopscorerAutocomplete(players) {

  const input = document.getElementById("topscorer-input");
  const results = document.getElementById("topscorer-results");

  if (!input || !results) return;

  input.oninput = () => {

    const value = input.value.toLowerCase().trim();

    results.innerHTML = "";
    if (!value) return;

    players
      .filter(p => p.toLowerCase().includes(value))
      .forEach(player => {

        const div = document.createElement("div");
        div.textContent = player;

        div.onclick = () => {
          input.value = player;
          results.innerHTML = "";

          tipsState.topScorer = player;
          autoSave();
        };

        results.appendChild(div);
      });
  };
}

/**
 * =========================
 * GOALS INPUT
 * =========================
 */

document.addEventListener("input", (e) => {
  if (e.target.id !== "goals-input") return;

  tipsState.goals = Number(e.target.value);
  autoSave();
});

/**
 * =========================
 * EXPORTS
 * =========================
 */

export {
  renderBettingMatches,
  renderAllPlayoffRounds,
  setAllTeams,
  initTopscorerAutocomplete
};