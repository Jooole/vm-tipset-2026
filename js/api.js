/**
 * =========================
 * API MODULE
 * =========================
 * Ansvar:
 * - Hämtar matcher från externa API:t
 * - Innehåller inga UI-funktioner
 * - Returnerar rå data till resten av appen
 */


//Mock-data för att testa utan API
const USE_MOCK = true; //ändra till false för att sluta använda mock-data
const MOCK_MATCHES = [
  {
    kickoff_utc: "2026-06-11T19:00:00.000Z",
    group_name: "A",
    home_team: "Mexico",
    away_team: "South Africa",
    home_team_code: "MEX",
    away_team_code: "RSA",
    home_score: null,
    away_score: null,
    stadium: "Estadio Azteca",
    status: "scheduled"
  },
  {
    kickoff_utc: "2026-06-12T19:00:00.000Z",
    group_name: "B",
    home_team: "USA",
    away_team: "Japan",
    home_team_code: "USA",
    away_team_code: "JPN",
    home_score: null,
    away_score: null,
    stadium: "MetLife Stadium",
    status: "scheduled"
  },
  {
  kickoff_utc: "2026-06-13T16:00:00.000Z",
  group_name: "C",
  home_team: "Brazil",
  away_team: "Germany",
  home_team_code: "BRA",
  away_team_code: "GER",
  home_score: null,
  away_score: null,
  stadium: "SoFi Stadium",
  status: "scheduled"
},

{
  kickoff_utc: "2026-06-13T19:00:00.000Z",
  group_name: "C",
  home_team: "Argentina",
  away_team: "France",
  home_team_code: "ARG",
  away_team_code: "FRA",
  home_score: null,
  away_score: null,
  stadium: "AT&T Stadium",
  status: "scheduled"
},

{
  kickoff_utc: "2026-06-14T16:00:00.000Z",
  group_name: "D",
  home_team: "Spain",
  away_team: "Italy",
  home_team_code: "ESP",
  away_team_code: "ITA",
  home_score: null,
  away_score: null,
  stadium: "Levi's Stadium",
  status: "scheduled"
},

{
  kickoff_utc: "2026-06-14T19:00:00.000Z",
  group_name: "D",
  home_team: "England",
  away_team: "Netherlands",
  home_team_code: "ENG",
  away_team_code: "NED",
  home_score: null,
  away_score: null,
  stadium: "Mercedes-Benz Stadium",
  status: "scheduled"
},

{
  kickoff_utc: "2026-06-15T16:00:00.000Z",
  group_name: "E",
  home_team: "Portugal",
  away_team: "Belgium",
  home_team_code: "POR",
  away_team_code: "BEL",
  home_score: null,
  away_score: null,
  stadium: "BC Place",
  status: "scheduled"
},

{
  kickoff_utc: "2026-06-15T19:00:00.000Z",
  group_name: "E",
  home_team: "Croatia",
  away_team: "Switzerland",
  home_team_code: "CRO",
  away_team_code: "SUI",
  home_score: null,
  away_score: null,
  stadium: "NRG Stadium",
  status: "scheduled"
},

{
  kickoff_utc: "2026-06-16T16:00:00.000Z",
  group_name: "F",
  home_team: "Sweden",
  away_team: "Norway",
  home_team_code: "SWE",
  away_team_code: "NOR",
  home_score: null,
  away_score: null,
  stadium: "Lumen Field",
  status: "scheduled"
},

{
  kickoff_utc: "2026-06-16T19:00:00.000Z",
  group_name: "F",
  home_team: "Denmark",
  away_team: "Finland",
  home_team_code: "DEN",
  away_team_code: "FIN",
  home_score: null,
  away_score: null,
  stadium: "Gillette Stadium",
  status: "scheduled"
},

{
  kickoff_utc: "2026-06-17T16:00:00.000Z",
  group_name: "G",
  home_team: "South Korea",
  away_team: "Australia",
  home_team_code: "KOR",
  away_team_code: "AUS",
  home_score: null,
  away_score: null,
  stadium: "Arrowhead Stadium",
  status: "scheduled"
},

{
  kickoff_utc: "2026-06-17T19:00:00.000Z",
  group_name: "G",
  home_team: "Canada",
  away_team: "Morocco",
  home_team_code: "CAN",
  away_team_code: "MAR",
  home_score: null,
  away_score: null,
  stadium: "Hard Rock Stadium",
  status: "scheduled"
}
];



const API_KEY = "wc26_JDF2xbAz8PGoYi7PYMRFfS";

const API_URL = "https://api.wc2026api.com/matches";

async function fetchMatches() {
  if (USE_MOCK) {
    console.log("USING MOCK DATA");
    return MOCK_MATCHES;
  }

  try {
    const response = await fetch(API_URL, {
      headers: {
        Authorization: `Bearer ${API_KEY}`
      }
    });

    const data = await response.json();
    return data;

  } catch (error) {
    console.error("Kunde inte hämta matcher:", error);
    return [];
  }
}


//Funktion för att spara data i local storage
function saveMatchesToCache(matches) {
  localStorage.setItem("matches_cache", JSON.stringify(matches));
  localStorage.setItem("matches_cache_time", Date.now());
}

function loadMatchesFromCache() {
  const data = localStorage.getItem("matches_cache");
  if (!data) return null;

  return JSON.parse(data);
}