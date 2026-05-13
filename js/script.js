// ========================
// START
// ========================

console.log("Script loaded");

// ========================
// FLAGS (ROBUST FIX)
// ========================

function getFlag(code) {
  if (!code) return "";

  const c = code.trim().toUpperCase();

  const map = {
    // ISO3 standard
    MEX: "mx",
    BRA: "br",
    ARG: "ar",
    SWE: "se",

    // Europe / FIFA codes
    GER: "de",
    FRA: "fr",
    ESP: "es",
    ITA: "it",
    ENG: "gb",
    SCO: "gb",
    WAL: "gb",
    NIR: "gb",

    // NON-ISO football codes (your error list fix)
    NED: "nl",
    SUI: "ch",
    CZE: "cz",
    BIH: "ba",
    POR: "pt",
    BEL: "be",
    AUT: "at",
    NOR: "no",
    DEN: "dk",
    FIN: "fi",

    URU: "uy",
    COL: "co",
    ECU: "ec",
    PAR: "py",
    PAN: "pa",

    MAR: "ma",
    ALG: "dz",
    TUN: "tn",
    EGY: "eg",
    SEN: "sn",
    GHA: "gh",
    CIV: "ci",

    KSA: "sa",
    IRN: "ir",
    IRQ: "iq",
    JOR: "jo",
    QAT: "qa",
    UAE: "ae",

    AUS: "au",
    NZL: "nz",

    TUR: "tr",
    RSA: "za",
    ZAF: "za",

    // Caribbean / misc
    CUW: "cw",
    CPV: "cv",
    HAI: "ht",
    COD: "cd",
    COG: "cg",
    UZB: "uz",

    KOR: "kr",
    CAN: "ca",
    USA: "us",
    JPN: "jp",
    CRO: "hr"
  };

  const iso2 = map[c];

  if (!iso2) {
    console.warn("Missing country code mapping:", c);
    return "";
  }

  return `https://flagcdn.com/24x18/${iso2}.png`;
}

// ========================
// DOM
// ========================

const todayToggle = document.getElementById("today-toggle");
const groupSelect = document.getElementById("group-select");
const matchesList = document.getElementById("matches-list");
const countdownElement = document.getElementById("countdown");

const navButtons = document.querySelectorAll(".nav-btn");
const pages = document.querySelectorAll(".page");

const ctaButton = document.getElementById("cta-btn");

// ========================
// STATE
// ========================

let matches = [];
let todaysMatchesOnly = false;
let activeGroup = "Alla grupper";

// ========================
// RENDER
// ========================

function renderMatches(data) {
  if (!matchesList) return;

  matchesList.innerHTML = "";

  const html = data.map(match => {
    const homeTeam = match.homeTeam || "Ännu inte avgjort";
    const awayTeam = match.awayTeam || "Ännu inte avgjort";

    const homeEmpty = match.homeScore == null;
    const awayEmpty = match.awayScore == null;

    return `
      <div class="match-item ${match.status === "live" ? "live-match" : ""}">

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
            <img class="flag" src="${match.homeFlag}" alt="" />
          </div>

          <div class="score-box ${homeEmpty ? "empty" : ""}">
            ${match.homeScore ?? ""}
          </div>

          <div class="score-divider">
            ${homeEmpty ? "-" : ":"}
          </div>

          <div class="score-box ${awayEmpty ? "empty" : ""}">
            ${match.awayScore ?? ""}
          </div>

          <div class="team">
            <img class="flag" src="${match.awayFlag}" alt="" />
            <span class="team-name">${awayTeam}</span>
          </div>

        </div>

        <div class="match-bottom">
          <span>${match.group}</span>
          <span>${match.stadium}</span>
        </div>

      </div>
    `;
  }).join("");

  matchesList.innerHTML = html;
}

// ========================
// FILTER
// ========================

function filterMatches() {
  let filtered = [...matches];

  if (activeGroup !== "Alla grupper") {
    filtered = filtered.filter(m => m.group === activeGroup);
  }

  if (todaysMatchesOnly) {
    const today = new Date().toISOString().split("T")[0];
    filtered = filtered.filter(m => m.date === today);
  }

  renderMatches(filtered);
}

// ========================
// EVENTS
// ========================

todayToggle?.addEventListener("change", () => {
  todaysMatchesOnly = todayToggle.checked;
  filterMatches();
});

groupSelect?.addEventListener("change", () => {
  activeGroup = groupSelect.value;
  filterMatches();
});

// ========================
// NAVIGATION
// ========================

navButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.page;

    pages.forEach(p => p.classList.remove("active"));
    navButtons.forEach(b => b.classList.remove("active"));

    document.getElementById(target)?.classList.add("active");
    btn.classList.add("active");
  });
});

// CTA
ctaButton?.addEventListener("click", () => {
  pages.forEach(p => p.classList.remove("active"));
  navButtons.forEach(b => b.classList.remove("active"));

  document.getElementById("betting")?.classList.add("active");

  document.querySelector('[data-page="betting"]')?.classList.add("active");
});

// ========================
// COUNTDOWN
// ========================

const worldCupStart = new Date("2026-06-11T20:00:00");

function updateCountdown() {
  if (!countdownElement) return;

  const now = new Date();
  const diff = worldCupStart - now;

  const days = Math.floor(diff / 1000 / 60 / 60 / 24);
  const hours = Math.floor((diff / 1000 / 60 / 60) % 24);
  const minutes = Math.floor((diff / 1000 / 60) % 60);

  countdownElement.textContent =
    `${days} dagar ${hours} timmar ${minutes} minuter`;
}

updateCountdown();
setInterval(updateCountdown, 60000);

// ========================
// API
// ========================

async function initMatches() {
  try {
    console.log("Loading API...");

    const apiMatches = await fetchMatches();

    if (!Array.isArray(apiMatches)) {
      console.error("API error:", apiMatches);
      return;
    }

    console.log("FIRST MATCH:", apiMatches[0]);

    matches = apiMatches.map(match => ({
      date: match.kickoff_utc?.split("T")[0] ?? "",

      time: new Date(match.kickoff_utc).toLocaleTimeString("sv-SE", {
        hour: "2-digit",
        minute: "2-digit"
      }),

      group: match.group_name
        ? `Grupp ${match.group_name}`
        : "Slutspel",

      homeTeam: match.home_team,
      awayTeam: match.away_team,

      // ✅ FIX: ISO3 → flagcdn works directly
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

    renderMatches(matches);

  } catch (err) {
    console.error("INIT ERROR:", err);
  }
}

// START
initMatches();
