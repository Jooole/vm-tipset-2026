/**
 * =========================
 * MAIN ENTRY POINT (FIXED)
 * =========================
 */

console.log("App started");

// =========================
// IMPORTS
// =========================
import { initAuthListener, isTipsLocked, loadTips, loadAllTips, loadActualResults, loadAllUsers, saveUserProfile, saveTips } from "./firebase.js";
import { calculateUserPoints, setActualResults, actualResults } from "./results.js";
import { renderBettingMatches, renderAllPlayoffRounds, setAllTeams, initTopscorerAutocomplete, hydrateBettingUI, fillInputsFromState } from "./betting.js";
import { initNavigation, initCountdown } from "./ui.js";
import { initMatchFilters, renderMatches } from "./matches.js";
import { ALLOWED_ADMINS, checkIsAdmin } from "./config.js";
import { fetchMatches } from "./api.js";
import { listenToMatches, listenToFacit } from "./realtime.js";
import { getFlag } from "./flags.js";
import { players } from "./players.js";


// =========================
// GLOBAL STATE
// =========================

const DEV_MODE = false;

function isLockedForUI() {
  if (DEV_MODE) return false; // 👈 viktig: alltid olåst i dev
  return isTipsLocked();
}

let hasLoadedMatches = false;
let liveUpdateInterval = null;
let previousLeaderboard = [];

window.matches = [];
window.allTips = [];
window.userTips = {};

// 🇸🇪 SVENSK ORDLISTA FÖR PRESENTATION I UI:T
window.teamTranslations = {
  "Algeria": "Algeriet",
  "Argentina": "Argentina",
  "Australia": "Australien",
  "Austria": "Österrike",
  "Belgium": "Belgien",
  "Bosnia-Herzegovina": "Bosnien och Hercegovina",
  "Brazil": "Brasilien",
  "Canada": "Kanada",
  "Cabo Verde": "Kap Verde",
  "Colombia": "Colombia",
  "Congo DR": "Kongo-Kinshasa",
  "Côte d'Ivoire": "Elfenbenskusten",
  "Croatia": "Kroatien",
  "Curaçao": "Curaçao",
  "Czechia": "Tjeckien",
  "Denmark": "Danmark",
  "Ecuador": "Ecuador",
  "Egypt": "Egypten",
  "England": "England",
  "France": "Frankrike",
  "Germany": "Tyskland",
  "Ghana": "Ghana",
  "Haiti": "Haiti",
  "IR Iran": "Iran",
  "Iraq": "Irak",
  "Japan": "Japan",
  "Jordan": "Jordanien",
  "Korea Republic": "Sydkorea",
  "Mexico": "Mexiko",
  "Morocco": "Marocko",
  "Netherlands": "Nederländerna",
  "New Zealand": "Nya Zeeland",
  "Norway": "Norge",
  "Panama": "Panama",
  "Paraguay": "Paraguay",
  "Poland": "Polen",
  "Portugal": "Portugal",
  "Qatar": "Qatar",
  "Saudi Arabia": "Saudiarabien",
  "Scotland": "Skottland",
  "Senegal": "Senegal",
  "South Africa": "Sydafrika",
  "Spain": "Spanien",
  "Sweden": "Sverige",
  "Switzerland": "Schweiz",
  "Tunisia": "Tunisien",
  "Turkey": "Turkiet",
  "Uruguay": "Uruguay",
  "USA": "USA",
  "Uzbekistan": "Uzbekistan",
};

// Funktion som returnerar svenskt namn om det finns, annars det engelska originalet
window.translateTeam = function (englishName) {
  if (!englishName) return "Ej klart";
  return window.teamTranslations[englishName.trim()] || englishName;
};

function applyMatchUpdates(baseMatches, updates) {
  return baseMatches.map(match => {
    const override = updates.find(u => u.id === match.id);

    if (!override) return match;

    return {
      ...match,
      ...override
    };
  });
}

// =========================
// INIT MATCHES
// =========================
async function initMatches() {
  if (hasLoadedMatches) return;
  hasLoadedMatches = true;

  const CACHE_KEY = "matches_cache";
  const CACHE_TIME_KEY = "matches_cache_time";
  const CACHE_MAX_AGE = 10 * 60 * 1000;

  try {
    console.log("Loading matches...");

    const cachedData = localStorage.getItem(CACHE_KEY);
    const cachedTime = localStorage.getItem(CACHE_TIME_KEY);

    const now = Date.now();
    const cacheAge = cachedTime ? now - Number(cachedTime) : null;

    // =========================
    // USE CACHE
    // =========================
    if (cachedData && cacheAge !== null && cacheAge < CACHE_MAX_AGE) {
      window.matches = JSON.parse(cachedData);
      console.log("DEBUG matches before render:", window.matches);
      renderAllUI(window.matches);
      console.log("DEBUG after renderAllUI"); return;
    }

    // =========================
    // FETCH FROM API
    // =========================
    console.log("Fetching from API...");

    const apiMatches = await fetchMatches();

    window.matches = apiMatches.map(match => ({
      id: match.id,

      date: match.kickoff_utc?.split("T")[0] ?? "",
      time: new Date(match.kickoff_utc).toLocaleTimeString("sv-SE", {
        hour: "2-digit",
        minute: "2-digit"
      }),

      group: match.group_name ? `Grupp ${match.group_name}` : "Slutspel",

      homeTeam: match.home_team,
      awayTeam: match.away_team,

      homeFlag: getFlag(match.home_team_code),
      awayFlag: getFlag(match.away_team_code),

      homeScore: match.home_score ?? null,
      awayScore: match.away_score ?? null,

      stadium: match.stadium ?? "",

      status:
        match.status === "completed"
          ? "finished"
          : match.status === "live"
            ? "live"
            : "upcoming"
    }));

    // SÄKERHETSSPÄRR: Spara BARA till cache om vi faktiskt fick matcher från API:et!
    if (window.matches && window.matches.length > 0) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(window.matches));
      localStorage.setItem(CACHE_TIME_KEY, Date.now());
    }

    renderAllUI(window.matches);

  } catch (err) {
    console.error("initMatches failed:", err);
  }
}

// =========================
// RENDER ALL UI
// =========================
function renderAllUI(matches) {
  window.matches = matches;

  renderMatches(matches);
  renderBettingMatches(matches);

  setAllTeams(getAllTeamsFromMatches(matches));
  renderAllPlayoffRounds();

  initTopscorerAutocomplete(players);
  hydrateBettingUI();

  // leaderboard måste köras EFTER all data finns
  renderLeaderboard();

}

// =========================
// TEAMS HELPERS
// =========================
function getAllTeamsFromMatches(matches) {
  const teams = new Set();

  matches.forEach(m => {
    if (m.homeTeam) teams.add(m.homeTeam);
    if (m.awayTeam) teams.add(m.awayTeam);
  });

  return Array.from(teams).sort();
}

// =========================
// LEADERBOARD
// =========================
async function renderLeaderboard(usersToUse, tipsToUse) {
  const tableBody = document.getElementById("leaderboard-body");
  if (!tableBody) return;

  const allUsers = usersToUse || await loadAllUsers();
  const allTipsList = tipsToUse || ((window.allTips && window.allTips.length > 0) ? window.allTips : []);

  // Bygg leaderboard för ALLA användare
  const leaderboard = allUsers.map(user => {
    const tipsEntry = allTipsList.find(t => t.userId === user.userId);

    // 🌟 FIXEN: Om användaren inte har några tips ännu, ge dem ett tomt objekt {} istället för att avbryta med null!
    const uTips = tipsEntry?.data || {};

    const points = calculateUserPoints({
      userTips: uTips,
      matches: window.matches || [],
      actualResults
    });

    return {
      userId: user.userId,
      name: user.data?.displayName || user.userId,
      points: points || 0 // Garantera att det blir en siffra (0) om poängen saknas
    };
  }); // 🌟 Tog bort .filter(Boolean) så att ingen rensas bort!

  // Sortera: Högst poäng först. Om poängen är lika (t.ex. alla har 0), sortera alfabetiskt på namn.
  leaderboard.sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    return a.name.localeCompare(b.name);
  });

  // Spara undan i globalt state för trendberäkning
  previousLeaderboard = [...leaderboard];

  // Rita ut i HTML
  tableBody.innerHTML = leaderboard.map((user, index) => {
    return `
      <tr>
        <td class="rank-column">${index + 1}</td>
        <td>${user.name}</td>
        <td class="points-column">${user.points}</td>
        <td class="trend-column">➡️</td>
      </tr>
    `;
  }).join("");
}

// =========================
// LOCK BETTING UI
// =========================
function lockBettingUI() {

  if (!isLockedForUI()) return;

  console.log("Tips are locked");

  // disable alla inputs
  document.querySelectorAll(".betting-input")
    .forEach(el => {
      el.disabled = true;
    });
}

// =========================
// BOOT
// =========================
initAuthListener(async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  // ⏱️ STARTA TIMERN FÖR SPINNERN DIREKT
  const spinnerElement = document.getElementById("loading-spinner");
  let spinnerTimeout = setTimeout(() => {
    if (spinnerElement) spinnerElement.classList.remove("hidden");
  }, 400);

  // Spara/uppdatera användaren i databasen automatiskt vid inloggning
  await saveUserProfile(user);

  console.log("Hämtar data från Firebase först...");

  try {
    // Starta live-lyssnaren för facit direkt
    listenToFacit((freshFacit) => {
      console.log("Facit uppdaterades live från Firestore! Ritar om...");
      setActualResults(freshFacit);
      renderLeaderboard(); // Tvingar leaderboarden att räkna om och rita om live!
    });

    // 1. HÄMTA ANVÄNDARENS TIPS FRÅN FIREBASE FÖRST
    const savedTips = await loadTips(user.uid) || {};

    // Spara ner dina laddade tips till fönstret så att betting.js kommer åt them!
    window.userTips = savedTips;
    // Spara ner dina laddade tips till fönstret så att betting.js kommer åt them!
    window.userTips = savedTips;

    // ✅ SÄKER FIX: Vi lägger loadAllTips i en egen try/catch. 
    // Om Firebase nekar detta (vilket är rätt före 7 juni) så kraschar inte användarens eget tips!
    try {
      window.allTips = await loadAllTips();
    } catch (leaderboardError) {
      console.log("Hämtning av andras tips blockeras av säkerhetsreglerna fram till 7 juni. Helt normalt.");
      window.allTips = []; // Sätt till en tom lista så länge
    }
    // STARTA BAKGRUNDS-SYNK: Fråga Firebase-servern i tysthet om det finns nyare data
    Promise.all([loadActualResults(), loadAllUsers()]).then(([freshFacit]) => {
      if (freshFacit) setActualResults(freshFacit);

      // Tvinga leaderboarden att ritas om med de färskaste poängen från servern!
      renderLeaderboard();
      console.log("Leaderboard och facit har synkats live med servern!");
    }).catch(err => console.log("Bakgrundssynk väntar på nätverk:", err));

    console.log("Firebase-data laddad och klar!");

    // 2. LADDA MATCHEN OCH RITA UT UI NU NÄR DATAN FINNS I MINNET
    await initMatches();

    // FIXEN: Tvinga gränssnittet att fylla i dina sparade gruppspels-mål i rutorna
    if (typeof fillInputsFromState === "function") {
      fillInputsFromState();
    }

    console.log("State ready och UI uppdaterat");

    // 🛑 ALL DATA ÄR KLAR! AVBRYT TIMERN OCH GÖM SPINNERN HÄR
    clearTimeout(spinnerTimeout);
    if (spinnerElement) spinnerElement.classList.add("hidden");

    // 3. INITIERA ALLA FILTERS OCH NAVIGATION
    console.log("INITING MATCH FILTERS");
    initMatchFilters();
    initNavigation();
    initCountdown();
    lockBettingUI();

    // 🌟 ADMIN-KONTROLL: KOMPLETT & ISOLERAD EXCEL-EXPORT
    const isAdmin = checkIsAdmin(user.uid);

    if (isAdmin) {
      console.log("Admin verifierad. Skapar backup-knapp i nav-menyn...");

      const navMenu = document.getElementById("main-nav");

      if (navMenu && !document.getElementById("admin-download-btn")) {

        const adminBtn = document.createElement("button");
        adminBtn.id = "admin-download-btn";
        adminBtn.innerText = "📥 Ladda ner allas tips";
        adminBtn.className = "nav-btn btn-admin";

        adminBtn.onclick = async () => {
          adminBtn.innerText = "⏳ Genererar Excel...";
          adminBtn.disabled = true;

          try {
            console.log("Admin startar backup: Hämtar data från Firebase...");

            // Hämta både alla tips och alla användarprofiler (för att få riktiga namn)
            const [currentTips, allUsers] = await Promise.all([
              loadAllTips(),
              loadAllUsers()
            ]);

            if (currentTips.length === 0) {
              alert("Det finns inga sparade tips i databasen ännu!");
              return;
            }

            // Skapa ett nytt Excel-dokument
            const workbook = new ExcelJS.Workbook();
            workbook.creator = "Admin Backup";
            workbook.created = new Date();

            // 🌟 DEKLARERA RÄKNAREN HÄR (UTANFÖR LOOPEN SÅ DEN INTE NOLLSTÄLLS)
            const användaFlikNamn = {};

            // Loopa igenom varje tips i databasen och skapa en egen flik per tippare
            currentTips.forEach((tipsEntry) => {
              const userTipsData = tipsEntry.data || null;

              // 🌟 LIVE-UPPSLAG: Leta upp användaren i listan vi hämtade från Firebase!
              const matchandeAnvandare = allUsers.find(u => u.userId === tipsEntry.userId);

              // Hämta displayName i första hand, fall tillbaka på UID om profilen saknas helt
              const userIdentifier = matchandeAnvandare?.data?.displayName || `Anvandare (${tipsEntry.userId ? tipsEntry.userId.substring(0, 5) : "Okand"})`;

              // Använd namnet direkt som grundnamn för Excel-fliken (max 20 tecken, inga specialtecken)
              let grundFlikNamn = userIdentifier.replace(/[*?:\/\\\[\]]/g, "").substring(0, 20).trim();
              if (!grundFlikNamn) grundFlikNamn = "Tippare";

              // 4. SÄKERHETSSPÄRR: Om fliknamnet redan har använts, lägg till _2, _3 osv så att ingen flik raderas
              let sheetName = grundFlikNamn;
              if (användaFlikNamn[sheetName.toLowerCase()]) {
                användaFlikNamn[sheetName.toLowerCase()] += 1;
                sheetName = `${grundFlikNamn}_${användaFlikNamn[sheetName.toLowerCase()]}`;
              } else {
                användaFlikNamn[sheetName.toLowerCase()] = 1;
              }

              // 5. Skapa arket i minnet med det unika namnet
              const sheet = workbook.addWorksheet(sheetName);

              // 1. Definiera kolumnernas bredd först (utan att skapa en rubrikrad automatisk)
              sheet.columns = [
                { key: 'match', width: 45 },
                { key: 'tip', width: 25 },
                { key: 'actual', width: 20 },
                { key: 'group', width: 20 }
              ];

              // 2. Skriv ut användarinformationen på RAD 1
              sheet.addRow({
                match: `Tippare: ${userIdentifier}`,
                tip: userTipsData ? "TIPS INLÄMNAT" : "TOMT TIPS",
                actual: "",
                group: `Export: ${new Date().toLocaleDateString("sv-SE")}`
              });

              // 3. Skriv ut kolumnrubrikerna manuellt på RAD 2
              const headerRow = sheet.addRow({
                match: 'Kategori / Match / Lag',
                tip: 'Tippat Resultat / Info',
                actual: 'Faktiskt resultat',
                group: 'Grupp / Typ'
              });

              // Gör den nya rubrikraden (Rad 2) fet
              headerRow.font = { bold: true };

              sheet.addRow({ match: "", tip: "", group: "" });
              sheet.addRow({ match: "⚽ GRUPPSPELSMATCHER", tip: "", group: "" });

              // 🌟 1. MATCHA OCH SKRIV UT GRUPPSPELSMATCHERNA (SORTERADE EFTER GRUPP)
              if (window.matches && window.matches.length > 0) {

                // Filtrera ut gruppspelsmatcher (sorterar bort eventuella slutspelsmatcher)
                const gruppMatcher = window.matches.filter(m => {
                  return m.group && !m.group.toLowerCase().includes("slutspel");
                });

                // 🌟 UPPDATERAD SORTERING: Sortera efter Grupp först (A-L), sedan efter Datum/Tid
                gruppMatcher.sort((a, b) => {
                  const gA = a.group || "";
                  const gB = b.group || "";

                  // Om grupperna är olika, sortera på gruppnamnet (t.ex. Grupp A före Grupp B)
                  if (gA !== gB) {
                    return gA.localeCompare(gB);
                  }

                  // Om grupperna är identiska, sortera kronologiskt efter datum och tid
                  const dateA = `${a.date || ""} T${a.time || ""}`;
                  const dateB = `${b.date || ""} T${b.time || ""}`;
                  return dateA.localeCompare(dateB);
                });

                gruppMatcher.forEach((match, mIdx) => {
                  // Bakåtkompatibel ID-kontroll (stödjer både siffer-ID "2" och gamla text-ID "Mexico-South Africa-0")
                  const genereratTextId = `${match.homeTeam}-${match.awayTeam}-${mIdx}`;
                  const pappersTip = userTipsData?.matches?.[match.id] || userTipsData?.matches?.[genereratTextId];

                  let tippatResultat = "-";

                  if (pappersTip) {
                    const hScore = pappersTip.home;
                    const aScore = pappersTip.away;
                    if (hScore !== undefined && hScore !== null && aScore !== undefined && aScore !== null) {
                      tippatResultat = `${hScore} - ${aScore}`;
                    }
                  }

                  // 🔮 HÄMTA DET FAKTISKA RESULTATET (Exakt samma logik som i dina match-vyer)
                  let faktisktResultat = "-";
                  if (match.homeScore !== null && match.awayScore !== null) {
                    faktisktResultat = `${match.homeScore} - ${match.awayScore}`;
                  } else if (match.status === "live") {
                    faktisktResultat = `${match.homeScore ?? 0} - ${match.awayScore ?? 0} (LIVE)`;
                  }

                  // Skriv ut raden i Excel (med lagnamnen översatta till svenska för snyggare presentation)
                  sheet.addRow({
                    match: `${window.translateTeam(match.homeTeam)} - ${window.translateTeam(match.awayTeam)}`,
                    tip: tippatResultat,
                    actual: faktisktResultat,
                    group: match.group || "Gruppspel"
                  });
                });
              }

              // 🌟 2. SKRIV UT ALLA SLUTSPELSVAL
              const playoffData = userTipsData?.playoffs || {};

              const rundor = [
                { key: 'round-of-32', namn: '🏆 LAG TILL 16-DELSFINAL (32 lag)' },
                { key: 'round-of-16', namn: '🏆 LAG TILL 8-DELSFINAL (16 lag)' },
                { key: 'quarterfinals', namn: '🏆 LAG TILL KVARTSFINAL (8 lag)' },
                { key: 'semifinals', namn: '🏆 LAG TILL SEMIFINAL (4 lag)' },
                { key: 'final', namn: '🏆 LAG TILL FINAL (2 lag)' },
                { key: 'winner', namn: '🥇 VM-VINNARE' }
              ];

              rundor.forEach(runda => {
                sheet.addRow({ match: "", tip: "", group: "" });
                sheet.addRow({ match: runda.namn, tip: "", group: "" });

                const lagData = playoffData[runda.key] || [];
                const lagLista = Object.values(lagData);

                if (lagLista.length > 0) {
                  lagLista.forEach((lagNamn, i) => {
                    // 🌟 NY STRUKTUR: Kolumn 1 får etiketten, Kolumn 2 får själva lagnamnet
                    sheet.addRow({
                      match: runda.key === 'winner' ? "Mästare" : `Lag ${i + 1}`,
                      tip: lagNamn,
                      actual: "-",
                      group: "Slutspelsval"
                    });
                  });
                } else {
                  sheet.addRow({
                    match: "Inga val gjorda",
                    tip: "-",
                    actual: "-",
                    group: "Slutspelsval"
                  });
                }
              });

              // 🌟 3. EXTRA-FRÅGOR LÄNGST NER
              sheet.addRow({ match: "", tip: "", group: "" });
              sheet.addRow({ match: "🌟 EXTRA-FRÅGOR", tip: "", group: "" });

              sheet.addRow({
                match: "Vem blir turneringens skyttekung?",
                tip: userTipsData?.topScorer || "-",
                actual: "-",
                group: "Skyttekung"
              });

              // Skapa raden för antal mål och spara en referens till den
              const goalsRow = sheet.addRow({
                match: "Hur många mål gör skytteligavinnaren totalt?",
                tip: userTipsData?.goals !== undefined && userTipsData?.goals !== null ? userTipsData.goals : "-",
                actual: "-",
                group: "Antal mål"
              });

              // 🌟 TVINGA CELLEN I KOLUMN 2 (B) ATT VARA VÄNSTERSTÄLLD
              goalsRow.getCell(2).alignment = { horizontal: 'left' };
            });

            // Generera filen och trigga automatisk nedladdning i webbläsaren
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = `VM_2026_Alla_Tips_${new Date().toISOString().split("T")[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();

            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            console.log("Excel-nedladdning klar!");

          } catch (err) {
            console.error("Kunde inte generera Excel-backup:", err);
            alert("Något gick fel vid genereringen av Excel-filen. Se detaljer i konsolen.");
          } finally {
            adminBtn.innerText = "📥 Ladda ner allas tips";
            adminBtn.disabled = false;
          }
        };

        navMenu.appendChild(adminBtn);
      }
    }

  } catch (error) {
    console.error("Kunde inte starta appen korrekt:", error);
  }

  // 4. REALTIME UPDATES
  listenToMatches(async (updates) => {
    console.log("Matches updated in realtime");

    if (!window.matches || window.matches.length === 0) {
      console.warn("Realtime saknade bas-matcher. Hämtar från API/Cache istället...");
      await initMatches();
    }

    if (!window.matches || window.matches.length === 0) {
      return;
    }

    const merged = applyMatchUpdates(window.matches, updates);
    window.matches = merged;

    renderMatches(window.matches);
    renderBettingMatches(window.matches);
  });

}); // Stänger initAuthListener


// =========================================================================
// DEV MODE (FOR TESTING) - ISOLATED SIMULATION
// =========================================================================
if (DEV_MODE) {
  window.devSimulateResult = async function (matchIdentifier, homeScore, awayScore) {
    console.log(`%c[DEV MODE] Simulerar match: ${matchIdentifier} -> ${homeScore}-${awayScore}`, "color: #2f6fed; font-weight: bold;");

    if (!window.matches || window.matches.length === 0) {
      console.error("Simulation misslyckades: window.matches är tom.");
      return;
    }

    // 1. DJUP KLONLYFT AV MATCH-STATE
    const simulatedMatches = structuredClone(window.matches);

    // 2. HITTA MATCHEN
    const match = simulatedMatches.find(m => {
      const matchIdStr = String(m.id).toLowerCase();
      const lookupStr = String(matchIdentifier).toLowerCase();
      const combinedTeams = `${m.homeTeam}-${m.awayTeam}`.toLowerCase();

      return matchIdStr === lookupStr || combinedTeams.includes(lookupStr) || m.homeTeam.toLowerCase().includes(lookupStr) || m.awayTeam.toLowerCase().includes(lookupStr);
    });

    if (!match) {
      console.error(`Kunde inte hitta match via söksträng: "${matchIdentifier}"`);
      return;
    }

    // 3. APPLICERA RESULTATEN PÅ KOPIAN
    match.homeScore = Number(homeScore);
    match.awayScore = Number(awayScore);
    match.status = "finished";

    // 4. RENDER MATCH UI TILLFÄLLIGT
    renderMatches(simulatedMatches);

    // 5. BERÄKNA SIMULERAD LEADERBOARD DIREKT TILL UI UTAN FIRESTORE-WRITES
    const tableBody = document.getElementById("leaderboard-body");
    if (!tableBody) return;

    const allUsers = await loadAllUsers();
    const tipsToUse = (window.allTips && window.allTips.length > 0) ? window.allTips : await loadAllTips();

    const simulatedLeaderboard = allUsers.map(user => {
      const tipsEntry = tipsToUse.find(t => t.userId === user.userId);
      const uTips = tipsEntry?.data || {};

      const points = calculateUserPoints({
        userTips: uTips,
        matches: simulatedMatches,
        actualResults
      });

      return {
        userId: user.userId,
        name: user.data?.displayName || user.userId,
        points
      };
    });

    simulatedLeaderboard.sort((a, b) => b.points - a.points);

    tableBody.innerHTML = simulatedLeaderboard.map((user, index) => `
      <tr style="background-color: #fffbeb;">
        <td>${index + 1} (Sim)</td>
        <td>${user.name} <span style="color: #d97706; font-size: 0.8rem;">[Simulerad]</span></td>
        <td style="font-weight: bold; color: #b45309;">${user.points}</td>
      </tr>
    `).join("");

    console.log("%c[DEV MODE] Simulering klar!", "color: #10b981; font-weight: bold;");
  };
}