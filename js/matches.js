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

// Funktion som ritar ut listan med matcher på skärmen samt användarens egna tips
export function renderMatches(data, userTips = window.userTips || {}) {

  // SÄKERHETSVENTIL: Kontrollerar att datan som skickas in faktiskt är en lista (Array).
  if (!Array.isArray(data)) {
    console.warn("renderMatches blocked invalid data:", data);
    return;
  }

  const matchesList = document.getElementById("matches-list");
  if (!matchesList) return;

  // Loopar igenom alla matcher i listan och förvandlar varje match-objekt till HTML-kod
  const html = data.map(match => {

    const isPlayoff = match.group === "Slutspel";

    const homeTeam = isPlayoff && (!match.homeTeam || match.homeTeam === "null")
      ? hamtaSlutspelsPlaceholder(match.id, "home")
      : window.translateTeam(match.homeTeam || "Ännu inte avgjort");

    const awayTeam = isPlayoff && (!match.awayTeam || match.awayTeam === "null")
      ? hamtaSlutspelsPlaceholder(match.id, "away")
      : window.translateTeam(match.awayTeam || "Ännu inte avgjort");

    // Kontrollerar om mål-fälten är tomma (null eller undefined)
    const homeEmpty = match.homeScore == null;
    const awayEmpty = match.awayScore == null;

    // Bestäm vad som ska visas i mitten baserat på om matchen har ett resultat eller inte
    let centerDisplayHTML = "";

    if (homeEmpty || awayEmpty) {
      centerDisplayHTML = `<div class="vs-text">VS</div>`;
    } else {
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

    // 🌟 NYTT: HÄMTA ANVÄNDARENS PERSONLIGA TIPS FÖR DENNA MATCH (SÄKERT & UTAN BUGGRISK)
    // Eftersom formatet är tips/userID/matches/matchID/home letar vi direkt i userTips.matches
    const pappersTip = userTips?.matches?.[match.id];
    let minTippadeRadHTML = "";

    if (pappersTip) {
      const hTip = pappersTip.home;
      const aTip = pappersTip.away;

      // Kontrollera att det faktiskt finns sparade siffror i tipset
      if (hTip !== undefined && hTip !== null && aTip !== undefined && aTip !== null) {
        minTippadeRadHTML = `
          <div class="user-match-badge" style="text-align: center; font-size: 0.85rem; color: #4b5563; margin-bottom: 8px; font-weight: 500; background: #f3f4f6; padding: 4px 12px; border-radius: 6px; display: inline-block;">
            Mitt tips: <strong style="color: #111827;">${hTip} - ${aTip}</strong>
          </div>
        `;
      }
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
        ${match.status === "finished"
        ? "Avslutad"
        : match.status === "live"
          ? "🔴 Live"
          : "Kommande"
      }
      </div>
    </div>

    <div style="display: flex; flex-direction: column; align-items: center; width: 100%;">
      <div class="match-center" style="width: 100%;">

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
      
      ${minTippadeRadHTML}
    </div>

    <div class="match-bottom">
      <span>
        ${match.group === "Slutspel" ? hamtaRundNamn(match.id) : match.group}
      </span>
      <span>${match.stadium}</span>
    </div>

  </div>
`;
  }).join("");

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

  // STEG 1: Filtrera på grupp (om användaren har valt en specifik grupp istället för "Alla grupper")
  if (activeGroup !== "Alla grupper") {
    filtered = filtered.filter(m =>
      // Jämför matchens grupp med den valda gruppen (gör om till små bokstäver och rensar mellanslag för säkerhet)
      m.group?.trim().toLowerCase() === activeGroup?.trim().toLowerCase()
    );
  }

  // STEG 2: Filtrera på datum (om användaren har klickat i rutan "Dagens matcher")
  if (todaysMatchesOnly) {
    // Hämtar dagens datum i formatet ÅÅÅÅ-MM-DD
    const today = new Date().toISOString().split("T")[0];
    // Sparar bara de matcher som har samma datum som idag
    filtered = filtered.filter(m => m.date === today);
  }

  console.log("FILTERED RESULT:", filtered.length);

  // Skicka den färdigfiltrerade listan till skärmen så den ritas om
  renderMatches(filtered, window.userTips);
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
  // 16-DELSFINALER (round: "R32")
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
  if (id === 91) return side === "home" ? "Vinnare Grupp M" : "Bästa trea (A/B/G/H/L)";

  // ==========================================
  // ÅTTONDELSFINALER (round: "R16")
  // ==========================================
  if (id === 94) return side === "home" ? "Vinnare match 82" : "Vinnare match 95";
  if (id === 89) return side === "home" ? "Vinnare match 93" : "Vinnare match 101";
  if (id === 74) return side === "home" ? "Vinnare match 79" : "Vinnare match 75";
  if (id === 99) return side === "home" ? "Vinnare match 100" : "Vinnare match 104";
  if (id === 77) return side === "home" ? "Vinnare match 88" : "Vinnare match 83";
  if (id === 87) return side === "home" ? "Vinnare match 81" : "Vinnare match 98";
  if (id === 103) return side === "home" ? "Vinnare match 97" : "Vinnare match 78";
  if (id === 96) return side === "home" ? "Vinnare match 86" : "Vinnare match 91"; // 👈 Det är matchen som vinnaren av Ghana möter!

  // ==========================================
  // KVARTSFINALER (round: "QF")
  // ==========================================
  if (id === 92) return side === "home" ? "Vinnare Åttondel 1" : "Vinnare Åttondel 2";
  if (id === 80) return side === "home" ? "Vinnare Åttondel 3" : "Vinnare Åttondel 4";
  if (id === 85) return side === "home" ? "Vinnare Åttondel 5" : "Vinnare Åttondel 6";
  if (id === 90) return side === "home" ? "Vinnare Åttondel 7" : "Vinnare Åttondel 8";

  // ==========================================
  // SEMIFINALER, BRONSMATCH OCH FINAL
  // ==========================================
  if (id === 76) return side === "home" ? "Vinnare Kvartsfinal 1" : "Vinnare Kvartsfinal 2";
  if (id === 102) return side === "home" ? "Vinnare Kvartsfinal 3" : "Vinnare Kvartsfinal 4";

  if (id === 84) return side === "home" ? "Förlorare Semifinal 1" : "Förlorare Semifinal 2";
  if (id === 73) return side === "home" ? "Vinnare Semifinal 1" : "Vinnare Semifinal 2";

  return side === "home" ? "Slutspelslag A" : "Slutspelslag B";
}

// ==========================================
// HJÄLPFUNKTION FÖR ATT GÖRA "SLUTSPEL" MER SPECIFIKT PÅ MATCHKORTEN
// ==========================================
function hamtaRundNamn(id) {
  const matchId = Number(id);

  // Vi mappar rundorna strikt efter hur ID-numren är tilldelade i ditt nätverkssvar
  if (matchId === 73) return "🏆 FINAL";
  if (matchId === 84) return "Bronsmatch";
  if (matchId === 76 || matchId === 102) return "Semifinal";

  // Kvartsfinaler (round: "QF" i API:et)
  if ([92, 80, 85, 90].includes(matchId)) return "Kvartsfinal";

  // Åttondelsfinaler (round: "R16" i API:et)
  if ([94, 89, 74, 99, 77, 87, 103].includes(matchId)) return "Åttondelsfinal";

  // 16-delsfinaler (round: "R32" i API:et - Här ingår match 91 och 104!)
  return "16-delsfinal";
}