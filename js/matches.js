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

// Globala inställningar för hur matcherna filtreras just nu
let todaysMatchesOnly = false; // Håller koll på om vi BARA ska visa dagens matcher (sant/falskt)
let activeGroup = "Alla grupper"; // Håller koll på vilken grupp som användaren valt att titta på

/**
 * Funktion som ritar ut listan med matcher på skärmen baserat på den data den får in
 */
export function renderMatches(data) {
  console.log("FIRST MATCH:", data[0]);

  // SÄKERHETSVENTIL: Kontrollerar att datan som skickas in faktiskt är en lista (Array).
  // Om det inte är en lista avbryts funktionen direkt för att appen inte ska krascha.
  if (!Array.isArray(data)) {
    console.warn("renderMatches blocked invalid data:", data);
    return;
  }

  // Dubbel säkerhetskontroll (gör samma sak som ovan)
  if (!Array.isArray(data)) {
    console.warn("renderMatches blocked invalid data:", data);
    return;
  }

  // Hämtar HTML-behållaren från index.html där matcherna ska ligga
  const matchesList = document.getElementById("matches-list");
  console.log("DEBUG matchesList element:", matchesList);
  console.log("DEBUG render input:", data.length);
  
  // Om behållaren inte finns i HTML-koden så avslutar vi direkt
  if (!matchesList) return;

  // Loopar igenom alla matcher i listan och förvandlar varje match-objekt till HTML-kod
  const html = data.map(match => {

// Om matchens grupp är "Slutspel" OCH lagnamnet är tomt eller strängen "null", så hämtar vi vår snygga text istället!
const isPlayoff = match.group === "Slutspel";

const homeTeam = isPlayoff && (!match.homeTeam || match.homeTeam === "null") 
  ? hamtaSlutspelsPlaceholder(match.id, "home") 
  : (match.homeTeam || "Ännu inte avgjort");

const awayTeam = isPlayoff && (!match.awayTeam || match.awayTeam === "null") 
  ? hamtaSlutspelsPlaceholder(match.id, "away") 
  : (match.awayTeam || "Ännu inte avgjort");

    // Kontrollerar om mål-fälten är tomma (null eller undefined)
    const homeEmpty = match.homeScore == null;
    const awayEmpty = match.awayScore == null;

    // Bestäm vad som ska visas i mitten baserat på om matchen har ett resultat eller inte
    let centerDisplayHTML = "";
    
    if (homeEmpty || awayEmpty) {
      // Om resultatet saknas -> Visa bara ett snyggt VS
      centerDisplayHTML = `<div class="vs-text">VS</div>`;
    } else {
      // Om resultatet finns -> Visa de gröna boxarna och kolonet precis som förut
      centerDisplayHTML = `
        <div class="score-box">
          ${match.homeScore}
        </div>
        <div class="score-divider">:</div>
        <div class="score-box">
          ${match.awayScore}
        </div>
      `;
    }

    // Skapar och returnerar det visuella "kortet" för matchen
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
        <span class="team-name">${homeTeam}</span>
        ${match.homeFlag ? `<img class="flag" src="${match.homeFlag}" />` : ""}
      </div>

      ${centerDisplayHTML}

      <div class="team">
        ${match.awayFlag ? `<img class="flag" src="${match.awayFlag}" />` : ""}
        <span class="team-name">${awayTeam}</span>
      </div>

    </div>

    <div class="match-bottom">
      <span>${match.group}</span>
      <span>${match.stadium}</span>
    </div>

  </div>
`;
  }).join(""); // Slår ihop alla match-kort till en enda lång textsträng av HTML

  // Gjut in all nyskapad HTML-kod i vår behållare på skärmen
  matchesList.innerHTML = html;
  console.log("RENDERED MATCHES COUNT:", data.length);
}

/**
 * Funktion som körs varje gång filtret ändras. 
 * Den sorterar ut rätt matcher och skickar dem till utritningen (renderMatches).
 */
function filterMatches() {
  console.log("FILTER TRIGGERED");
  
  // Skapar en kopia av alla matcher från vårt globala fönster-state (window.matches)
  let filtered = [...window.matches];
  
  console.log("ACTIVE GROUP:", activeGroup);
  console.log("AVAILABLE GROUPS:", window.matches.map(m => m.group));

  // STEG 1: Filtrera på grupp (om användaren har valt en specifik grupp istället för "Alla grupper")
  if (activeGroup !== "Alla grupper") {
    filtered = filtered.filter(m =>
      // Jämför matchens grupp med den valda gruppen (gör om till små bokstäver och rensar mellanslag för säkerhet)
      m.group?.trim().toLowerCase() === activeGroup?.trim().toLowerCase()
    );  }

  // STEG 2: Filtrera på datum (om användaren har klickat i rutan "Dagens matcher")
  if (todaysMatchesOnly) {
    // Hämtar dagens datum i formatet ÅÅÅÅ-MM-DD
    const today = new Date().toISOString().split("T")[0];
    // Sparar bara de matcher som har samma datum som idag
    filtered = filtered.filter(m => m.date === today);
  }
    
  console.log("FILTERED RESULT:", filtered.length);

  // Skicka den färdigfiltrerade listan till skärmen så den ritas om
  renderMatches(filtered);
}

/**
 * Startfunktion för att koppla ihop hemsidans knappar/rullistor med filtreringslogiken
 */
export function initMatchFilters() {
  // Hämtar reglaget för dagens matcher samt rullistan för grupper från index.html
  const todayToggle = document.getElementById("today-toggle");
  const groupSelect = document.querySelector(".group-select");
  
  // Lyssnar på om användaren slår på/av knappen för "Dagens matcher"
  todayToggle?.addEventListener("change", () => {
    todaysMatchesOnly = todayToggle.checked; // Sparar om den är ikryssad (true) eller inte (false)
    filterMatches(); // Kör filtreringen på nytt
  });

  // Lyssnar på om användaren byter grupp i rullistan
  groupSelect?.addEventListener("change", () => {
    console.log("GROUP SELECT CHANGED:", groupSelect.value);

    activeGroup = groupSelect.value; // Sparar namnet på den nya gruppen som valdes
    filterMatches(); // Kör filtreringen på nytt
  });
}

/**
 * Hjälpfunktion för att plocka ut alla unika lag som deltar i turneringen
 * (Denna används inte direkt i den här filen men kan exporteras/användas på andra ställen)
 */
function getAllTeamsFromMatches(matches) {
  const teams = new Set(); // En "Set" är en smart lista som vägrar spara dubbletter

  // Gå igenom varje match och lägg till båda lagen i listan
  matches.forEach(m => {
    if (m.homeTeam) teams.add(m.homeTeam);
    if (m.awayTeam) teams.add(m.awayTeam);
  });

  // Gör om vår "Set" till en vanlig lista (Array) och sorterar den i bokstavsordning (A-Ö)
  return Array.from(teams).sort();
}


// Enkel hjälpfunktion som översätter API:ets engelska slutspels-text till svenska
function snyggaTillSlutspelstext(engelskText) {
  if (!engelskText) return "Ännu inte avgjort";

  // Vi gör om texten till små bokstäver så att det är lättare att jämföra
  const text = engelskText.toLowerCase();

  // Om texten innehåller "winner", byt ut till "Vinnare" + behåll resten (t.ex. Grupp A)
  if (text.includes("winner")) {
    return engelskText.replace(/Winner of /i, "Vinnare ").replace(/Winner /i, "Vinnare ");
  }

  // Om texten innehåller "runner-up" eller "second", byt ut till "Tvåa"
  if (text.includes("runner-up") || text.includes("runner up") || text.includes("2nd")) {
    return engelskText.replace(/Runner-up of /i, "Tvåa ").replace(/Runner-up /i, "Tvåa ").replace(/2nd /i, "Tvåa ");
  }

  // Om det är en specifik slutspelsmatch (t.ex. W49 = Vinnare match 49)
  if (text.startsWith("w") && !isNaN(text.substring(1))) {
    return `Vinnare match ${text.substring(1)}`;
  }

  // Om texten redan är fin eller om vi inte hittar en mall, visa den som den är
  return engelskText;
}


// En helt exakt funktion baserad på ditt API:s unika ID-nummer för slutspelet 2026
function hamtaSlutspelsPlaceholder(matchId, side) {
  const id = Number(matchId);

  // ==========================================
  // 16-DELSFINALER (Matchas mot dina API-id:n)
  // ==========================================
  if (id === 82) return side === "home" ? "Tvåa Grupp A" : "Tvåa Grupp B";
  if (id === 95) return side === "home" ? "Vinnare Grupp C" : "Tvåa Grupp F";
  if (id === 93) return side === "home" ? "Vinnare Grupp E" : "Bästa trea (A/B/C/D/F)";
  if (id === 101) return side === "home" ? "Vinnare Grupp F" : "Tvåa Grupp C";
  if (id === 79) return side === "home" ? "Tvåa Grupp E" : "Tvåa Grupp I";
  if (id === 75) return side === "home" ? "Vinnare Grupp I" : "Bästa trea (C/D/F/G/H)";
  if (id === 100) return side === "home" ? "Vinnare Grupp A" : "Bästa trea (C/E/F/H/I)";
  if (id === 104) return side === "home" ? "Vinnare Grupp L" : "Bästa trea (E/H/I/J/K)";
  if (id === 88) return side === "home" ? "Vinnare Grupp G" : "Bästa trea (A/E/H/I/J)";
  if (id === 83) return side === "home" ? "Vinnare Grupp D" : "Bästa trea (B/E/F/I/J)";
  if (id === 81) return side === "home" ? "Vinnare Grupp H" : "Tvåa Grupp J";
  if (id === 98) return side === "home" ? "Tvåa Grupp K" : "Tvåa Grupp L";
  if (id === 97) return side === "home" ? "Vinnare Grupp B" : "Bästa trea (B/E/F/G/I/J)";
  if (id === 78) return side === "home" ? "Tvåa Grupp D" : "Tvåa Grupp G";
  if (id === 86) return side === "home" ? "Vinnare Grupp J" : "Tvåa Grupp H";
  if (id === 80) return side === "home" ? "Vinnare Grupp K" : "Bästa trea (D/E/I/J/L)";

  // ==========================================
  // ÅTTONDELSFINALER
  // ==========================================
  if (id === 91) return side === "home" ? "Vinnare match 73" : "Vinnare match 75";
  if (id === 94) return side === "home" ? "Vinnare match 74" : "Vinnare match 77";
  if (id === 89) return side === "home" ? "Vinnare match 76" : "Vinnare match 78";
  if (id === 74) return side === "home" ? "Vinnare match 79" : "Vinnare match 80";
  if (id === 99) return side === "home" ? "Vinnare match 76" : "Vinnare match 78";
  if (id === 77) return side === "home" ? "Vinnare match 79" : "Vinnare match 80";
  if (id === 87) return side === "home" ? "Vinnare match 81" : "Vinnare match 82";
  if (id === 103) return side === "home" ? "Vinnare match 83" : "Vinnare match 84";

  // ==========================================
  // KVARTSFINALER
  // ==========================================
  if (id === 96) return side === "home" ? "Vinnare match 89" : "Vinnare match 90";
  if (id === 92) return side === "home" ? "Vinnare match 93" : "Vinnare match 94";
  if (id === 85) return side === "home" ? "Vinnare match 91" : "Vinnare match 92";
  if (id === 90) return side === "home" ? "Vinnare match 95" : "Vinnare match 96";

  // ==========================================
  // SEMIFINALER
  // ==========================================
  if (id === 76) return side === "home" ? "Vinnare match 97" : "Vinnare match 98";
  if (id === 102) return side === "home" ? "Vinnare match 99" : "Vinnare match 100";

  // ==========================================
  // BRONSMATCH OCH FINAL
  // ==========================================
  if (id === 84) return side === "home" ? "Förlorare match 93" : "Förlorare match 94"; // Bronsmatch
  if (id === 73) return side === "home" ? "Vinnare match 101" : "Vinnare match 102"; // 🏆 VM-FINALEN!

  // Säkerhetsreserv om något ID skulle saknas
  return side === "home" ? "Slutspelslag A" : "Slutspelslag B";
}