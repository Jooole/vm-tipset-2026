/**
 * =========================
 * MAIN ENTRY POINT (FIXED)
 * =========================
 */

console.log("App started");

// =========================
// IMPORTS
// =========================
import { initAuthListener, isTipsLocked, loadTips, loadAllTips, loadActualResults, loadAllUsers, saveUserProfile, saveTips, logoutUser } from "./firebase.js";
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
// Försök hämta sparad tabellhistorik från local storage så att trenden överlever omladdningar!
let previousLeaderboard = JSON.parse(localStorage.getItem("vm_leaderboard_history")) || [];

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
async function initMatches(bypassCheck = false) {
  if (hasLoadedMatches && !bypassCheck) return;
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

    // 🌟 SÄKERHETSSPÄRR: Om API:et skickar ett felmeddelande istället för matcher, krascha inte hela appen!
    if (!Array.isArray(apiMatches)) {
      console.error("API returnerade ingen array. Rensar cachen...", apiMatches);
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_TIME_KEY);
      window.matches = [];
      renderAllUI([]);
      return;
    }

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

  renderMatches(matches, window.userTips);
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
// LEADERBOARD (STRIKT OCH SÄKRAD TRENDLOGIK)
// =========================
async function renderLeaderboard(usersToUse, tipsToUse, matchesToUse) {
  window.renderLeaderboard = renderLeaderboard;
  const tableBody = document.getElementById("leaderboard-body");
  if (!tableBody) return;

  const allUsers = usersToUse || await loadAllUsers();
  const allTipsList = tipsToUse || ((window.allTips && window.allTips.length > 0) ? window.allTips : []);

  // 🌟 FIX: Använd de inskickade matcherna (viktigt för simulatorn) eller fönstret
  const currentMatches = matchesToUse || window.matches || [];

  // 1. Bygg nuvarande tabell baserat på gällande matcher
  const leaderboard = allUsers.map(user => {
    const tipsEntry = allTipsList.find(t => t.userId === user.userId);
    const uTips = tipsEntry?.data || {};

    const points = calculateUserPoints({
      userTips: uTips,
      matches: currentMatches, // 🌟 Använder rätt match-array!
      actualResults
    });

    return {
      userId: user.userId,
      name: user.data?.displayName || user.userId,
      points: points || 0
    };
  });

  // 2. Sortera tabellen (Poäng -> Namn)
  leaderboard.sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    return a.name.localeCompare(b.name);
  });

  // 3. Hämta historiken
  let historicalLeaderboard = JSON.parse(localStorage.getItem("vm_leaderboard_history"));

  if (!historicalLeaderboard || historicalLeaderboard.length !== leaderboard.length) {
    localStorage.setItem("vm_leaderboard_history", JSON.stringify(leaderboard));
    historicalLeaderboard = [...leaderboard];
  }

  // 4. Kontrollera om poängen faktiskt skiljer sig från historiken
  const hasScoreChanged = leaderboard.some(user => {
    const histMatch = historicalLeaderboard.find(p => p.userId === user.userId);
    return !histMatch || histMatch.points !== user.points;
  });

  // 5. Rita ut i HTML (Jämför nuvarande placering med historisk placering)
  tableBody.innerHTML = leaderboard.map((user, index) => {
    const currentRank = index + 1;

    let trendEmoji = "➔";
    let trendClass = "stable";

    const prevIndex = historicalLeaderboard.findIndex(p => p.userId === user.userId);

    if (prevIndex !== -1) {
      const previousRank = prevIndex + 1;

      if (currentRank < previousRank) {
        trendEmoji = "▲";
        trendClass = "up";
      } else if (currentRank > previousRank) {
        trendEmoji = "▼";
        trendClass = "down";
      }
    }

    return `
      <tr>
        <td class="rank-column">${currentRank}</td>
        <td>${user.name}</td>
        <td class="points-column">${user.points}</td>
        <td class="trend-column">
          <span class="rank-change ${trendClass}">${trendEmoji}</span>
        </td>
      </tr>
    `;
  }).join("");

  // 6. Spara historiken om poängen har ändrats på riktigt
  if (hasScoreChanged) {
    localStorage.setItem("vm_leaderboard_history", JSON.stringify(leaderboard));
    console.log("⚽ Poängändring upptäckt! Ny tabellhistorik sparad.");
  }
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
      renderMatches(window.matches, window.userTips);
      // Uppdatera färgerna på "Mitt tips" direkt vid live-ändringar i databasen!
      renderAllPlayoffRounds();
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
      if (freshFacit) {
        setActualResults(freshFacit);
        window.actualResults = freshFacit; // 🌟 SÄKRAR ATT BETTING.JS SER DATAN!
      }

      // Tvinga leaderboarden att ritas om med de färskaste poängen från servern!
      renderLeaderboard();
      renderMatches(window.matches, window.userTips);
      // Tvinga även slutspelets dropdowns att ritas om och rättas så fort facit laddat!
      renderAllPlayoffRounds();
      // Kontrollera om finalen är avgjord och rita i så fall ut Hall of Fame!
      renderFinalSummaryHTML();

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
    lockBettingUI();

    // SÄKRA FÄRGERNA PÅ SIDA 1: Vänta ut betting.js-timern och färga alla rätta tips gröna direkt!
    setTimeout(() => {
      renderAllPlayoffRounds();
      // Kör kollen om finalen har spelats färdigt vid första sidladdningen!
      renderFinalSummaryHTML();
      console.log("🟢 Första slutspelsrättningen är färgad och klar!");
    }, 400);

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

              // Felsäker hämtning av skyttekungen från alla möjliga databasnivåer
              const skyttekungTips = userTipsData?.topScorer || tipsEntry?.topScorer || tipsEntry?.data?.topScorer || "-";

              sheet.addRow({
                match: "Vem blir turneringens skyttekung?",
                tip: skyttekungTips,
                actual: "-",
                group: "Skyttekung"
              });

              // Felsäker hämtning av antal mål från alla möjliga databasnivåer
              const antalMalTips = userTipsData?.goals !== undefined && userTipsData?.goals !== null ? userTipsData.goals :
                (tipsEntry?.goals !== undefined && tipsEntry?.goals !== null ? tipsEntry.goals :
                  (tipsEntry?.data?.goals !== undefined && tipsEntry?.data?.goals !== null ? tipsEntry.data.goals : "-"));

              // Skapa raden för antal mål och spara en referens till den (behåller din exakta originalstruktur)
              const goalsRow = sheet.addRow({
                match: "Hur många mål gör skytteligavinnaren totalt?",
                tip: antalMalTips,
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

    // 🚪 UTLOGGNINGS-KNAPP (Säker och isolerad)
    // 🚪 UTLOGGNINGS-KNAPP (Centrerad och klar)
    const navMenu = document.getElementById("main-nav");

    if (navMenu && !document.getElementById("logout-nav-item")) {
      const logoutLi = document.createElement("li");
      logoutLi.id = "logout-nav-item";

      // Vi lägger till "display: inline-flex; justify-content: center;" för att centrera allt
      logoutLi.innerHTML = `
        <button class="nav-btn logout-btn">
          Logga ut
        </button>
      `;

      logoutLi.querySelector("button").onclick = async (e) => {
        e.preventDefault();

        if (confirm("Vill du verkligen logga ut från VM-tips?")) {
          try {
            await logoutUser(); // Rensar din Firebase-session
            window.location.href = "login.html"; // Skickar dig till login-sidan
          } catch (err) {
            alert("Kunde inte logga ut: " + err.message);
          }
        }
      };

      navMenu.appendChild(logoutLi);
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

    renderMatches(window.matches, window.userTips);
    renderBettingMatches(window.matches);
  });

  // =========================================================================
  // SMART HÄNDELSESTYRD LIVE-MOTOR (Optimerad för 10-minutersintervall)
  // =========================================================================
  if (!liveUpdateInterval) {
    console.log("STARTING LIVE MOTOR (10 MIN LIVE INTERVAL)");

    async function runSmartLiveCheck() {
      const now = new Date();
      let hasLiveMatch = false;
      let nextMatchStart = null;

      // 1. ANALYSERA SPELSCHEMAT
      window.matches.forEach(match => {
        if (match.status === "live" || match.status === "in_play") {
          hasLiveMatch = true;
        }

        if (match.date) {
          const matchStart = new Date(match.date);
          if (matchStart > now) {
            if (!nextMatchStart || matchStart < nextMatchStart) {
              nextMatchStart = matchStart;
            }
          } else if (match.status !== "finished") {
            hasLiveMatch = true;
          }
        }
      });

      // 2. HANTERA UTIFRÅN CURRENT STATE
      let nextCheckDelay = 15 * 60 * 1000; // Standard fallback: 15 minuter

      if (hasLiveMatch) {
        // SCENARIO A: Match spelas! Uppdaterar UI och hämtar från API var 10:e minut
        console.log("⚽ Match pågår live! Hämtar nya mål var 10:e minut.");

        try {
          localStorage.removeItem("matches_cache");
          localStorage.removeItem("matches_cache_time");
          await initMatches(true);
          if (window.matches && window.matches.length > 0) {
            renderMatches(window.matches, window.userTips);
          }
        } catch (err) {
          console.error("Live-update failed during match:", err);
        }

        nextCheckDelay = 5 * 60 * 1000; // 🌟 10 minuter till nästa koll

      } else if (nextMatchStart) {
        // SCENARIO B: Sömnläge mellan matcher
        const msUntilNextMatch = nextMatchStart.getTime() - now.getTime();
        const buffer = 2 * 60 * 1000; // Vakna 2 min innan start
        nextCheckDelay = msUntilNextMatch - buffer;

        if (nextCheckDelay > 4 * 60 * 60 * 1000) {
          nextCheckDelay = 4 * 60 * 60 * 1000; // Max djupsömn: 4 timmar
        }

        if (nextCheckDelay < 10000) {
          nextCheckDelay = 30000;
        }

        console.log(`🚫 Ingen match live. Sömnläge i ${Math.round(nextCheckDelay / 1000 / 60)} minuter.`);
      }

      // 3. STARTA NÄSTA SMARTA TIMEOUT
      liveUpdateInterval = setTimeout(runSmartLiveCheck, nextCheckDelay);
    }

    runSmartLiveCheck();
  }

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


// 🏆 GENERERA OCH RETA UT SLUTCEREMONIN (HALL OF FAME & STATS)
// DEN HÄR VYN SKA VISAS FÖRST NÄR VM-FINALEN HAR SPELATS FÄRDIGT
function renderFinalSummaryHTML() {
  const endedContainer = document.getElementById("playoff-ended-view");
  const defaultContainer = document.getElementById("default-home-view");
  if (!endedContainer || !defaultContainer) return;

  // Kontrollera om finalen (id 73) är färdigspelad
  const finalMatch = window.matches?.find(m => Number(m.id) === 73);
  const isFinalFinished = finalMatch && finalMatch.status === "finished";

  if (!isFinalFinished) {
    endedContainer.innerHTML = "";
    defaultContainer.style.display = "block";
    return;
  }

  // Om finalen är klar – dölj standardvyn och generera Hall of Fame!
  defaultContainer.style.display = "none";

  // 1. Beräkna den fullständiga sluttabellen
  const leaderboard = (window.allUsers || []).map(user => {
    const tipsEntry = window.allTips?.find(t => t.userId === user.userId);
    const uTips = tipsEntry?.data || {};
    const points = calculateUserPoints({ userTips: uTips, matches: window.matches, actualResults: window.actualResults });
    return { name: user.data?.displayName || "Okänd", points: points || 0, userTips: uTips };
  });

  // Sortera: Flest poäng först
  leaderboard.sort((a, b) => b.points - a.points);

  // 2. Beräkna prispotten. Räknar bara med deltagare som faktiskt lämnat in tips (points > 0 eller giltiga tips)
  const betalandeDeltagare = leaderboard.filter(u => u.points > 0 || Object.keys(u.userTips?.matches || {}).length > 0);
  const inkop = 100;
  const totalPott = betalandeDeltagare.length * inkop;

  // 🌟 UPPDATERAD PROCENTFÖRDELNING: 50% / 30% / 20%
  const vinst1 = Math.round(totalPott * 0.50);
  const vinst2 = Math.round(totalPott * 0.30);
  const vinst3 = Math.round(totalPott * 0.20);

  // 🌟 DYNAMISK POTTDELNING VID DELADE PLATSER
  const p1 = leaderboard[0] ? { ...leaderboard[0], prize: 0 } : { name: "-", points: 0, prize: 0 };
  const p2 = leaderboard[1] ? { ...leaderboard[1], prize: 0 } : { name: "-", points: 0, prize: 0 };
  const p3 = leaderboard[2] ? { ...leaderboard[2], prize: 0 } : { name: "-", points: 0, prize: 0 };

  if (totalPott > 0 && leaderboard.length > 0) {
    const pts1 = p1.points;
    const pts2 = p2.points;
    const pts3 = p3.points;
    const pts4 = leaderboard[3] ? leaderboard[3].points : -1;
    const pts5 = leaderboard[4] ? leaderboard[4].points : -1;

    // SCENARIO 1: Alla tre i toppen har exakt samma poäng (3 delar på första)
    if (pts1 === pts2 && pts2 === pts3) {
      const deladPott3 = Math.round((vinst1 + vinst2 + vinst3) / 3);
      p1.prize = deladPott3;
      p2.prize = deladPott3;
      p3.prize = deladPott3;
    }
    // SCENARIO 2: Två personer delar på förstaplatsen
    else if (pts1 === pts2) {
      const deladPott2 = Math.round((vinst1 + vinst2) / 2);
      p1.prize = deladPott2;
      p2.prize = deladPott2;

      // Kolla om 3:an delar sin poäng med 4:an och 5:an
      let antalSomDelarTrean = 1;
      if (pts3 === pts4) antalSomDelarTrean = 2;
      if (pts3 === pts4 && pts3 === pts5) antalSomDelarTrean = 3;

      p3.prize = Math.round(vinst3 / antalSomDelarTrean);
    }
    // SCENARIO 3: Ensam vinnare, men 2:an och 3:an delar på andraplatsen
    else if (pts2 === pts3) {
      const deladPottAndra = Math.round((vinst2 + vinst3) / 2);
      p1.prize = vinst1; // Ensam vinnare får hela förstapriset (50%)
      p2.prize = deladPottAndra;
      p3.prize = deladPottAndra;
    }
    // SCENARIO 4: Ensam 1:a, ensam 2:a, men 3:e platsen delas med folk utanför pallen
    else {
      p1.prize = vinst1;
      p2.prize = vinst2;

      let antalSomDelarTrean = 1;
      if (pts3 === pts4) antalSomDelarTrean = 2;
      if (pts3 === pts4 && pts3 === pts5) antalSomDelarTrean = 3;

      p3.prize = Math.round(vinst3 / antalSomDelarTrean);
    }
  }

  // 3. BERÄKNA UTSTÄMPLINGAR & STATISTIK
  const totalDeltagare = leaderboard.length;
  const aktivaDeltagare = leaderboard.filter(u => u.points > 0);
  const ligansSnitt = aktivaDeltagare.length > 0 ? Math.round(aktivaDeltagare.reduce((sum, u) => sum + u.points, 0) / aktivaDeltagare.length) : 0;

  // Funktion för att hitta vem som hade flest rätt i en specifik array/slutspelsrunda
  function hämtaSlutspelsMästare(facitKey, userPlayoffKey) {
    let maxRätt = -1;
    let vinnare = [];

    const räknaRätt = (predicted, actual) => {
      if (!predicted || !actual) return 0;
      const cleanActual = actual.map(t => String(t).trim().toLowerCase());
      return Object.values(predicted).filter(t => cleanActual.includes(String(t).trim().toLowerCase())).length;
    };

    leaderboard.forEach(u => {
      const rättAnat = räknaRätt(u.userTips?.playoffs?.[userPlayoffKey], window.actualResults?.[facitKey]);
      if (rättAnat > maxRätt) {
        maxRätt = rättAnat;
        vinnare = [u.name];
      } else if (rättAnat === maxRätt && maxRätt > 0) {
        vinnare.push(u.name);
      }
    });
    return maxRätt > 0 ? `${vinnare.join(", ")} (${maxRätt} lag rätt)` : "Ingen prickade rätt";
  }

  // Flest korrekta resultat i gruppspelet (4-poängare)
  let maxGruppSpikar = -1;
  let gruppVinnare = [];
  leaderboard.forEach(u => {
    let spikar = 0;
    window.matches.filter(m => m.group && !m.group.includes("Slutspel")).forEach((m, idx) => {
      const matchId = m.id || `${m.homeTeam}-${m.awayTeam}-${idx}`;
      const pred = u.userTips?.matches?.[matchId];
      if (pred && m.homeScore !== null && Number(pred.home) === Number(m.homeScore) && Number(pred.away) === Number(m.awayScore)) {
        spikar++;
      }
    });
    if (spikar > maxGruppSpikar) {
      maxGruppSpikar = spikar;
      gruppVinnare = [u.name];
    } else if (spikar === maxGruppSpikar && maxGruppSpikar > 0) {
      gruppVinnare.push(u.name);
    }
  });

  // Skyttekungens profeter
  const rättSkytt = leaderboard.filter(u => u.userTips?.topScorer && window.actualResults?.topScorer && u.userTips.topScorer.trim().toLowerCase() === window.actualResults.topScorer.trim().toLowerCase()).map(u => u.name);

  // VM-mästarens profeter (De som tippade rätt guldlag!)
  const rättVinnare = leaderboard.filter(u => {
    const tippadVinnare = u.userTips?.playoffs?.winner?.["winner-0"]; // Plockar ut vinnaren från slutspelsträdet
    const faktiskVinnare = window.actualResults?.winner;
    return tippadVinnare && faktiskVinnare && tippadVinnare.trim().toLowerCase() === faktiskVinnare.trim().toLowerCase();
  }).map(u => u.name);

  // 4. GENERERA HTML-STRÄNGEN
  endedContainer.innerHTML = `
    <div class="final-hero">
      <h2>🏆 VM-TIPSET 2026 ÄR AVGJORT!</h2>
      <p>Efter 104 matcher av spänning, dramatik och sena kvällar har vi fått en slutgiltig vinnare i tipsligan.</p>
    </div>

    <div class="podium-container">
      
      <div class="podium-step silver">
        <span class="podium-medal">2</span> <div class="podium-name">${p2.name}</div>
        <div class="podium-points">${p2.points} p</div>
        <div class="podium-prize">${p2.prize > 0 ? p2.prize + ' kr' : '0 kr'}</div>
      </div>

      <div class="podium-step gold">
        <span class="podium-medal">1</span> <div class="podium-name">${p1.name}</div>
        <div class="podium-points">${p1.points} p</div>
        <div class="podium-prize">${p1.prize > 0 ? p1.prize + ' kr' : '0 kr'}</div>
      </div>

      <div class="podium-step brons">
        <span class="podium-medal">3</span> <div class="podium-name">${p3.name}</div>
        <div class="podium-points">${p3.points} p</div>
        <div class="podium-prize">${p3.prize > 0 ? p3.prize + ' kr' : '0 kr'}</div>
      </div>

    </div>

    <div style="text-align: center; margin: 2.5rem 0 3rem 0;">
      <button class="view-all-results-btn" onclick="window.location.hash='resultat'">
        Visa alla resultat
      </button>
    </div>

    <div class="stats-grid">
      
      <div class="stats-card section-title-card">
        <h3>Statistik från tippningen</h3>
      </div>
      
      <div class="stats-card">
        <div class="stats-label">Ligans genomsnitt</div>
        <div class="stats-value">${ligansSnitt} poäng</div>
      </div>

      <div class="stats-card">
        <div class="stats-label">Flest spikade resultat</div>
        <div class="stats-value">${maxGruppSpikar > 0 ? `${gruppVinnare.join(", ")} (${maxGruppSpikar} st)` : "-"}</div>
      </div>

      <div class="stats-card">
        <div class="stats-label">Rätt målskytt</div>
        <div class="stats-value">${rättSkytt.length > 0 ? rättSkytt.join(", ") : "Ingen prickade rätt"}</div>
      </div>

      <div class="stats-card">
        <div class="stats-label">Flest korrekta lag till 16-delsfinal</div>
        <div class="stats-value">${hämtaSlutspelsMästare("roundOf32", "round-of-32")}</div>
      </div>

      <div class="stats-card">
        <div class="stats-label">Flest korrekta lag till 8-delsfinal</div>
        <div class="stats-value">${hämtaSlutspelsMästare("roundOf16", "round-of-16")}</div>
      </div>

      <div class="stats-card">
        <div class="stats-label">Flest korrekta lag till Kvartsfinal</div>
        <div class="stats-value">${hämtaSlutspelsMästare("quarterfinals", "quarterfinals")}</div>
      </div>

      <div class="stats-card">
        <div class="stats-label">Flest korrekta lag till Semifinal</div>
        <div class="stats-value">${hämtaSlutspelsMästare("semifinals", "semifinals")}</div>
      </div>

      <div class="stats-card">
        <div class="stats-label">Flest korrekta lag till Final</div>
        <div class="stats-value">${hämtaSlutspelsMästare("final", "final")}</div>
      </div>

      <div class="stats-card">
        <div class="stats-label">Tippade rätt världsmästare</div>
        <div class="stats-value">
          ${rättVinnare.length > 0 ? rättVinnare.join(", ") : "Ingen prickade rätt"}
        </div>
      </div>

    </div>

    <div class="final-footer">
      <div class="feedback-box">
        <h4>Hur kan vi förbättra appen?</h4>
        <p>Du får jättegärna ge feedback på appen och berätta vad du tyckte var bra eller vad vi kan förbättra till nästa mästerskap. Skicka dina tankar och idéer till Staffan på <a href="mailto:cykelgubben@telia.com">cykelgubben@telia.com</a>.</p>
      </div>
    </div>
  `;
}
window.renderFinalSummaryHTML = renderFinalSummaryHTML;