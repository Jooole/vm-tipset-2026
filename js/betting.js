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

  // Filtrera ut alla gruppspelsmatcher precis som tidigare
  const groupMatches = matches.filter(m =>
    m.group?.startsWith("Grupp")
  );

  // 🌟 1. SORTERA OCH GRUPPERA MATCHERNA UTAN ATT ÄNDRA ORIGINAL-ARRAYEN
  const groupedMatches = {};

  groupMatches.forEach((match, index) => {
    const groupName = match.group || "Övriga grupper";
    if (!groupedMatches[groupName]) {
      groupedMatches[groupName] = [];
    }
    // Vi sparar matchen tillsammans med dess originalIndex så att matchId genereras identiskt!
    groupedMatches[groupName].push({ match, originalIndex: index });
  });

  // Sortera gruppnamnen i bokstavsordning (Grupp A till Grupp L)
  const sortedGroupNames = Object.keys(groupedMatches).sort();

  // 🌟 2. BYGG HTML-STRÄNGEN MED GRUPPRUBRIKER
  let htmlResult = "";

  sortedGroupNames.forEach(groupName => {
    // Skapa en snygg rubrik för varje grupp
    htmlResult += `
      <div class="betting-group-section" style="margin-top: 30px; margin-bottom: 15px;">
        <h3 class="group-title" style="padding-bottom: 5px; border-bottom: 2px solid var(--color-border); margin-bottom: 15px; font-size: 1.25rem">
          ${groupName}
        </h3>
      </div>
    `;

    // Loopa igenom matcherna som tillhör just denna grupp
    groupedMatches[groupName].forEach(({ match, originalIndex }) => {
      const homeTeam = match.homeTeam || "TBD";
      const awayTeam = match.awayTeam || "TBD";

      // 🌟 VIKTIGT: matchId behåller EXAKT samma logik och index som innan för att matcha din bindMatchInputs() och Firebase!
      const matchId = match.id || `${homeTeam}-${awayTeam}-${originalIndex}`;

      htmlResult += `
        <div class="match-card" data-id="${matchId}">

          <span>${window.translateTeam(homeTeam)} - ${window.translateTeam(awayTeam)}</span>

          <div class="score-inputs">
            <input type="number" inputmode="numeric" min="0" class="home-score betting-input">
            <div class="score-divider">-</div>
            <input type="number" inputmode="numeric" min="0" class="away-score betting-input">
          </div>

        </div>
      `;
    });
  });

  // Skriv ut all grupperad HTML i behållaren
  container.innerHTML = htmlResult;

  bindMatchInputs(); // 👈 Låter din befintliga lyssnare binda sig till alla inputs helt orört!
  fillInputsFromState(); // Fyller i sparade resultat i rutorna helt orört!
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

  const selections = window.userTips?.playoffs?.[containerId] || {};
  const facit = window.actualResults || {};

  const facitKey = {
    "round-of-32": "roundOf32",
    "round-of-16": "roundOf16",
    "quarterfinals": "quarterfinals",
    "semifinals": "semifinals",
    "final": "final",
    "winner": "winner"
  }[containerId];

  // 🇸🇪 En spegellista för att säkert göra om svenska namn till engelska vid jämförelse
  const tillEngelska = {
    "Algeriet": "Algeria", "Argentina": "Argentina", "Australien": "Australia", "Österrike": "Austria",
    "Belgien": "Belgium", "Bosnien och Hercegovina": "Bosnia-Herzegovina", "Brasilien": "Brazil",
    "Kanada": "Canada", "Kap Verde": "Cabo Verde", "Colombia": "Colombia", "Kongo-Kinshasa": "Congo DR",
    "Elfenbenskusten": "Côte d'Ivoire", "Kroatien": "Croatia", "Curaçao": "Curaçao", "Tjeckien": "Czechia",
    "Danmark": "Denmark", "Ecuador": "Ecuador", "Egypten": "Egypt", "England": "England",
    "Frankrike": "France", "Tyskland": "Germany", "Ghana": "Ghana", "Haiti": "Haiti", "Iran": "IR Iran",
    "Irak": "Iraq", "Japan": "Japan", "Jordanien": "Jordan", "Sydkorea": "Korea Republic",
    "Mexiko": "Mexico", "Marocko": "Morocco", "Nederländerna": "Netherlands", "Nya Zeeland": "New Zealand",
    "Norge": "Norway", "Panama": "Panama", "Paraguay": "Paraguay", "Polen": "Poland", "Portugal": "Portugal",
    "Qatar": "Qatar", "Saudiarabien": "Saudi Arabia", "Skottland": "Scotland", "Senegal": "Senegal",
    "Sydafrika": "South Africa", "Spanien": "Spain", "Sverige": "Sweden", "Schweiz": "Switzerland",
    "Tunisien": "Tunisia", "Turkiet": "Turkey", "Uruguay": "Uruguay", "USA": "USA", "Uzbekistan": "Uzbekistan"
  };

  let html = `<h4>${title}</h4>`;

  for (let i = 0; i < slots; i++) {
    const rawSelection = selections[i] || "";

    // 🌟 TVINGA FRAM ENGELSKA: Om namnet är på svenska, översätt det till engelska, annars behåll det som det är.
    const selectedTeam = (tillEngelska[rawSelection.trim()] || rawSelection).toLowerCase().trim();

    const availableTeams = allTeams.filter(team =>
      !Object.values(selections).includes(team) ||
      team === rawSelection
    );

    let correctClass = "";
    if (selectedTeam && facitKey && facit[facitKey]) {
      if (containerId === "winner") {
        if (facit[facitKey].toLowerCase().trim() === selectedTeam) {
          correctClass = "tip-correct";
        }
      } else if (Array.isArray(facit[facitKey])) {
        // Jämför det garanterat engelska tippade namnet mot API-facit
        const finnsIFacit = facit[facitKey].some(t => t.toLowerCase().trim() === selectedTeam);
        if (finnsIFacit) {
          correctClass = "tip-correct";
        }
      }
    }

    html += `
      <select class="playoff-select input-base betting-input ${correctClass}"
        data-round="${containerId}"
        data-slot="${i}">
        <option value="">Välj lag</option>

        ${availableTeams.map(team => `
          <option value="${team}" ${team === rawSelection ? "selected" : ""}>
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
        // Variabler högre upp eller precis innan för att hålla koll på scroll
        let touchStartHeight = 0;
        let isScrolling = false;

        // ... inuti din loop där du skapar spelarraderna ...

        // 1. När fingret sätts ner, spara startpositionen
        item.ontouchstart = (e) => {
          touchStartHeight = e.touches[0].clientY;
          isScrolling = false;
        };

        // 2. Om fingret rör sig mer än 10 pixlar i höjdled, tolka det som en scroll!
        item.ontouchmove = (e) => {
          const currentHeight = e.touches[0].clientY;
          if (Math.abs(touchStartHeight - currentHeight) > 10) {
            isScrolling = true;
          }
        };

        // 3. När fingret lyfts, välj bara spelaren om användaren INTE scrollade
        item.ontouchend = (e) => {
          if (isScrolling) return; // Användaren scrollar bara, avbryt stängning!

          e.preventDefault(); // Stoppa falska musklick

          input.value = playerName;
          results.classList.remove("show"); // Göm dropdownen säkert
          updateState("topScorer", playerName); // Sparar valet till Firestore
        };

        // 4. Fallback för vanliga datormöss (desktop) så att det fortfarande går att klicka där
        item.onmousedown = (e) => {
          // Körs bara om det är en riktig mus (inte touch)
          if (e.button === 0) {
            input.value = playerName;
            results.classList.remove("show");
            updateState("topScorer", playerName);
          }
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

  const tippadSpelare = window.userTips?.topScorer || "";
  input.value = tippadSpelare;

  // Rätta mot facit
  const facitSkyttekung = window.actualResults?.topScorer || "";
  if (tippadSpelare && facitSkyttekung && tippadSpelare.trim().toLowerCase() === facitSkyttekung.trim().toLowerCase()) {
    input.classList.add("tip-correct");
  } else {
    input.classList.remove("tip-correct");
  }
}

function hydrateGoals() {
  const input = document.getElementById("goals-input");
  if (!input) return;

  const tippadeMal = window.userTips?.goals;
  input.value = tippadeMal ?? "";

  // Rätta mot facit (Räkna bara om facit-målen är registrerade och över 0)
  const facitMal = Number(window.actualResults?.topScorerGoals || 0);
  if (tippadeMal !== undefined && tippadeMal !== null && facitMal > 0 && Number(tippadeMal) === facitMal) {
    input.classList.add("tip-correct");
  } else {
    input.classList.remove("tip-correct");
  }
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