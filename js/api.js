const API_KEY = "wc26_JDF2xbAz8PGoYi7PYMRFfS";

const API_URL = "https://api.wc2026api.com/matches";

async function fetchMatches() {
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