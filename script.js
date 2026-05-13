const todayToggle = document.getElementById("today-toggle");

let todaysMatchesOnly = false;

const matches = [

  {
    date: "2026-06-11",
    time: "17:00",
    group: "Grupp A",
    homeTeam: "Mexiko",
    awayTeam: "Kanada",
    homeFlag: "🇲🇽",
    awayFlag: "🇨🇦",
    homeScore: 2,
    awayScore: 1,
    stadium: "Azteca Stadium, Mexico City",
    status: "finished"
  },

  {
    date: "2026-06-12",
    time: "20:00",
    group: "Grupp A",
    homeTeam: "USA",
    awayTeam: "Marocko",
    homeFlag: "🇺🇸",
    awayFlag: "🇲🇦",
    homeScore: 1,
    awayScore: 0,
    stadium: "MetLife Stadium, New York",
    status: "finished"
  },

  {
    date: "2026-06-13",
    time: "15:00",
    group: "Grupp B",
    homeTeam: "Brasilien",
    awayTeam: "Argentina",
    homeFlag: "🇧🇷",
    awayFlag: "🇦🇷",
    homeScore: 1,
    awayScore: 1,
    stadium: "Hard Rock Stadium, Miami",
    status: "live"
  },

  {
    date: "2026-06-13",
    time: "18:00",
    group: "Grupp E",
    homeTeam: "Frankrike",
    awayTeam: "Tyskland",
    homeFlag: "🇫🇷",
    awayFlag: "🇩🇪",
    homeScore: null,
    awayScore: null,
    stadium: "SoFi Stadium, Los Angeles",
    status: "upcoming"
  }

];

const matchesList = document.getElementById("matches-list");

function renderMatches(matchesToRender) {

  matchesList.innerHTML = "";

  matchesToRender.forEach(match => {

    const matchHTML = `

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
            <span class="team-name">${match.homeTeam}</span>
            <span class="flag">${match.homeFlag}</span>
          </div>

          <div class="score-box ${match.homeScore === null ? "empty" : ""}">
            ${match.homeScore ?? ""}
          </div>

          <div class="score-divider">
            ${match.homeScore === null ? "-" : ":"}
          </div>

          <div class="score-box ${match.awayScore === null ? "empty" : ""}">
            ${match.awayScore ?? ""}
          </div>

          <div class="team">
            <span class="flag">${match.awayFlag}</span>
            <span class="team-name">${match.awayTeam}</span>
          </div>

        </div>

        <div class="match-bottom">

          <span>${match.group}</span>

          <span>${match.stadium}</span>

        </div>

      </div>

    `;

    matchesList.innerHTML += matchHTML;

  });

}

renderMatches(matches);

// NAVIGATION

const navButtons = document.querySelectorAll(".nav-btn");
const pages = document.querySelectorAll(".page");

navButtons.forEach(button => {

  button.addEventListener("click", () => {

    const targetPage = button.dataset.page;

    pages.forEach(page => {
      page.classList.remove("active");
    });

    navButtons.forEach(btn => {
      btn.classList.remove("active");
    });

    document.getElementById(targetPage).classList.add("active");

    button.classList.add("active");
  });

});


// CTA BUTTON

const ctaButton = document.getElementById("cta-btn");

ctaButton.addEventListener("click", () => {

  pages.forEach(page => {
    page.classList.remove("active");
  });

  navButtons.forEach(btn => {
    btn.classList.remove("active");
  });

  document.getElementById("betting").classList.add("active");

  document
    .querySelector('[data-page="betting"]')
    .classList.add("active");
});


// COUNTDOWN

const countdownElement = document.getElementById("countdown");

// Exempel-datum
const worldCupStart = new Date("2026-06-11T20:00:00");

function updateCountdown() {

  const now = new Date();

  const difference = worldCupStart - now;

  const days = Math.floor(difference / 1000 / 60 / 60 / 24);

  const hours = Math.floor(
    difference / 1000 / 60 / 60 % 24
  );

  const minutes = Math.floor(
    difference / 1000 / 60 % 60
  );

  countdownElement.textContent =
    `${days} dagar ${hours} timmar ${minutes} minuter`;
}

updateCountdown();

setInterval(updateCountdown, 60000);

const groupButtons = document.querySelectorAll("[data-group]");
const statusButtons = document.querySelectorAll("[data-status]");

let activeGroup = "Alla grupper";
let activeStatus = "all";

function filterMatches() {

  let filteredMatches = [...matches];

  // GROUP FILTER

  if (activeGroup !== "Alla grupper") {

    filteredMatches = filteredMatches.filter(match =>
      match.group === activeGroup
    );

  }

  // STATUS FILTER

  if (activeStatus !== "all") {

    filteredMatches = filteredMatches.filter(match =>
      match.status === activeStatus
    );

  }

  // TODAY FILTER

if (todaysMatchesOnly) {

  const today = new Date();

  const todayString =
    today.toISOString().split("T")[0];

  filteredMatches = filteredMatches.filter(match =>
    match.date === todayString
  );

}

  renderMatches(filteredMatches);
}


// GROUP BUTTONS

groupButtons.forEach(button => {

  button.addEventListener("click", () => {

    groupButtons.forEach(btn =>
      btn.classList.remove("active")
    );

    button.classList.add("active");

    activeGroup = button.dataset.group;

    filterMatches();

  });

});


// STATUS BUTTONS

statusButtons.forEach(button => {

  button.addEventListener("click", () => {

    statusButtons.forEach(btn =>
      btn.classList.remove("active")
    );

    button.classList.add("active");

    activeStatus = button.dataset.status;

    filterMatches();

  });

});

todayToggle.addEventListener("change", () => {

  todaysMatchesOnly = todayToggle.checked;

  filterMatches();

});