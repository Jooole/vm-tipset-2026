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
    // Sätter reservtext om lagnamn skulle saknas i datan
    const homeTeam = match.homeTeam || "Ännu inte avgjort";
    const awayTeam = match.awayTeam || "Ännu inte avgjort";

    // Kontrollerar om mål-fälten är tomma (null eller undefined)
    const homeEmpty = match.homeScore == null;
    const awayEmpty = match.awayScore == null;

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