/**
 * =========================
 * BETTING MODULE
 * =========================
 */

import { saveTips } from "./firebase.js";

/**
 * =========================
 * STATE
 * =========================
 */

window.userTips = window.userTips || {
  matches: {},
  playoffs: {},
  topScorer: "",
  goals: 0
};

function updateState(path, value) {
  const state = window.userTips;

  const keys = path.split(".");
  let obj = state;

  for (let i = 0; i < keys.length - 1; i++) {
    if (!obj[keys[i]]) obj[keys[i]] = {};
    obj = obj[keys[i]];
  }

  obj[keys[keys.length - 1]] = value;

  autoSave();
}

function ensureStateStructure() {
  window.userTips = window.userTips || {};

  window.userTips.matches ||= {};
  window.userTips.playoffs ||= {};
  window.userTips.topScorer ||= "";
  window.userTips.goals ||= 0;
}

let allTeams = [];

let saveTimeout;

/**
 * =========================
 * AUTO SAVE (SAFE CLONE)
 * =========================
 */

function autoSave() {
  clearTimeout(saveTimeout);

  saveTimeout = setTimeout(() => {
    if (!window.currentUser) {
      console.warn("Autosave blockerad: Ingen användare är inloggad.");
      return;
    }

    // Fixa den avbrutna strukturen till en stabil klon
    const payload = typeof structuredClone === "function" 
      ? structuredClone(window.userTips) 
      : JSON.parse(JSON.stringify(window.userTips));

    console.log("Autosave triggad! Sparar till Firestore...", payload);
    saveTips(window.currentUser.uid, payload);
  }, 1000); // Sparar 1 sekund efter att användaren slutat skriva
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

        <span>${window.translateTeam(homeTeam)} - ${window.translateTeam(awayTeam)}</span>

        <div class="score-inputs">
          <input type="number" inputmode="numeric" min="0" class="home-score betting-input">
          <div class="score-divider">-</div>
          <input type="number" inputmode="numeric"min="0" class="away-score betting-input">
        </div>

      </div>
    `;
  }).join("");

  bindMatchInputs(); // 👈 IMPORTANT: bind efter render
  fillInputsFromState(); //Fyll UI med sparad data
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

    const matchId = card.dataset.id;
    if (!matchId) return;

    // Vi lyssnar på när användaren skriver i den första rutan (Hemmalag)
    inputs[0].oninput = () => {
      updateState(`matches.${matchId}.home`, inputs[0].value);
    };

    // Vi lyssnar på när användaren skriver i den andra rutan (Bortalag)
    inputs[1].oninput = () => {
      updateState(`matches.${matchId}.away`, inputs[1].value);
    };
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

  const selections =
  window.userTips?.playoffs?.[containerId] || {};

  let html = `<h4>${title}</h4>`;

  for (let i = 0; i < slots; i++) {

    const selectedTeam = selections[i] || "";

    const availableTeams = allTeams.filter(team =>
      !Object.values(selections).includes(team) ||
      team === selectedTeam
    );

    html += `
      <select class="playoff-select input-base betting-input"
        data-round="${containerId}"
        data-slot="${i}">
        <option value="">Välj lag</option>

        ${availableTeams.map(team => `
          <option value="${team}" ${team === selectedTeam ? "selected" : ""}>
            ${window.translateTeam(team)}
          </option>
        `).join("")}

      </select>
    `;
  }

  container.innerHTML = html;
}

/**
 * =========================
 * PLAYOFF LISTENERS
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

    updateState(`playoffs.${round}.${slot}`, value);

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

  // CENTRAL RENDER-FUNKTION: Bygger dropdown-menyn strukturerat per land
  function renderDropdown(filterText = "") {
    results.innerHTML = ""; // Töm listan först

    // Gruppera de spelare vars namn matchar sökningen
    const grouped = {};
    players.forEach(player => {
      // player är nu ett objekt: { name: "...", country: "..." }
      const matchesSearch = player.name.toLowerCase().includes(filterText.toLowerCase().trim());
      
      if (matchesSearch) {
        if (!grouped[player.country]) {
          grouped[player.country] = [];
        }
        grouped[player.country].push(player.name);
      }
    });

    // Loopa igenom länderna och rita ut rubriker + spelarrader
    Object.keys(grouped).forEach(country => {
      // Skapa en icke-valbar landsrubrik
      const header = document.createElement("div");
      header.className = "dropdown-header";
      // 🌟 HÄR FÄRGAS LANDSRUBRIKEN I DROPDOWNEN SVENSK
      header.innerText = window.translateTeam(country);
      results.appendChild(header);

      // Skapa spelarna under detta land
      grouped[country].forEach(playerName => {
        const item = document.createElement("div");
        item.className = "dropdown-item";
        item.innerText = playerName;

        // När man klickar på en spelare, välj den och spara till state
        item.onclick = () => {
          input.value = playerName;
          results.classList.remove("show"); // Göm dropdownen efter val
          updateState("topScorer", playerName); // Sparar valet till Firestore
        };

        results.appendChild(item);
      });
    });
  }

  // 1. KLICK-LYSSNARE: Visa alla spelare sorterade per land direkt när man klickar i fältet
  input.onclick = () => {
    results.classList.add("show");
    renderDropdown(""); // Tom sträng = visa allt
  };

  // 2. SKRIV-LYSSNARE: Filtrera listan och hantera om fältet töms helt
  input.oninput = () => {
    const nuvarandeVärde = input.value.trim();

    // Om användaren har suddat ut allt, spara det tomma värdet till databasen direkt
    if (nuvarandeVärde === "") {
      updateState("topScorer", "");
    }

    results.classList.add("show");
    renderDropdown(input.value);
  };

  // 3. STÄNG-LYSSNARE: Göm dropdownen om användaren klickar utanför fältet/menyn
  document.addEventListener("click", (e) => {
    if (e.target !== input && !results.contains(e.target)) {
      results.classList.remove("show");
    }
  });
}

/**
 * =========================
 * GOALS INPUT
 * =========================
 */

document.addEventListener("input", (e) => {
  if (e.target.id !== "goals-input") return;

  updateState("goals", Number(e.target.value));
});

/**
 * =========================
 * SAVE TIPS
 * =========================
 */

function saveCurrentUserTips() {
  const user = window.currentUser;
  if (!user) return;

  saveTips(user.uid, window.userTips);
}

/**
 * =========================
 * FILL BETTING INPUTS FROM STATE
 * =========================
 */
export function fillInputsFromState() {
  const cards = document.querySelectorAll(".match-card");

  cards.forEach(card => {
    const matchId = card.dataset.id;
    if (!matchId) return;

    const data = window.userTips?.matches?.[matchId];
    if (!data) return;

    const inputs = card.querySelectorAll("input");
    if (inputs.length < 2) return;

    inputs[0].value = data.home ?? "";
    inputs[1].value = data.away ?? "";
  });
}

function hydrateBettingUI() {
  renderBettingMatches(window.matches || []);
  renderAllPlayoffRounds();
  
  // Vi väntar 200 millisekunder så att alla rullistor och textfält 
  // har hunnit ritas ut på skärmen, sen stoppar vi in all sparad data!
  setTimeout(() => {
    fillInputsFromState(); // Fyller i matcherna (t.ex. 2-1)
    hydrateTopScorer();    // Fyller i namnet på skytteligavinnaren
    hydrateGoals();        // Fyller i antalet mål
    
    // Vi tvingar även slutspelets rullistor att ritas om en gång till 
    // nu när de garanterat vet vad användaren har tippat
    renderAllPlayoffRounds(); 
    
    console.log("Allt slutspels- och skytteligadata har tryckts in i UI!");
  }, 200);
}

function hydrateTopScorer() {
  const input = document.getElementById("topscorer-input");
  if (!input) return;

  input.value = window.userTips?.topScorer || "";
}

function hydrateGoals() {
  const input = document.getElementById("goals-input");
  if (!input) return;

  input.value = window.userTips?.goals ?? "";
}

/**
 * =========================
 * EXPORTS
 * =========================
 */

export {
  renderBettingMatches,
  renderAllPlayoffRounds,
  setAllTeams,
  initTopscorerAutocomplete,
  hydrateBettingUI,
  ensureStateStructure
};