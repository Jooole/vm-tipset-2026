/**
 * =========================
 * RESULTS / SCORING
 * =========================
 */

const POINTS = {
  exactMatch: 4,
  correctOutcome: 2,

  roundOf32: 3,
  roundOf16: 3,
  quarterfinal: 3,

  semifinal: 5,
  final: 6,

  winner: 10,

  topScorer: 8,
  topScorerGoals: 5
};



/**
 * =========================
 * GET PLAYER BETS
 * =========================
 */
function getMatchPoints(prediction, result) {
  if (!prediction || !result) return 0;

  // SÄKERHETSSPÄRR: Om matchen inte har spelats (homeScore är null), ge 0 poäng direkt!
  if (result.homeScore === null || result.awayScore === null) {
    return 0;
  }

  const predictedHome = Number(prediction.home);
  const predictedAway = Number(prediction.away);

  const actualHome = Number(result.homeScore);
  const actualAway = Number(result.awayScore);

  // exakt resultat
  if (
    predictedHome === actualHome &&
    predictedAway === actualAway
  ) {
    return POINTS.exactMatch;
  }

  // rätt utfall
  const predictedDiff = predictedHome - predictedAway;
  const actualDiff = actualHome - actualAway;

  const predictedOutcome =
    predictedDiff === 0
      ? "draw"
      : predictedDiff > 0
      ? "home"
      : "away";

  const actualOutcome =
    actualDiff === 0
      ? "draw"
      : actualDiff > 0
      ? "home"
      : "away";

  if (predictedOutcome === actualOutcome) {
    return POINTS.correctOutcome;
  }

  return 0;
}

/**
 * =========================
 * HELPER FOR PLAYOFF ROUNDS
 * =========================
 */
function countCorrectTeams(predicted = {}, actual = []) {
  return Object.values(predicted)
    .filter(team => actual.includes(team))
    .length;
}

/**
 * =========================
 * CALCULATE PLAYER POINTS
 * =========================
 */
export function calculateUserPoints({
  userTips,
  matches,
  actualResults
}) {

  let total = 0;

  /**
   * =========================
   * MATCHES
   * =========================
   */

  matches.forEach((match, index) => {

    const matchId =
      match.id ||
      `${match.homeTeam}-${match.awayTeam}-${index}`;

    const prediction =
      userTips.matches?.[matchId];

    total += getMatchPoints(prediction, match);
  });

  /**
   * =========================
   * PLAYOFFS
   * =========================
   */

  total +=
    countCorrectTeams(
      userTips.playoffs?.["round-of-32"],
      actualResults.roundOf32
    ) * POINTS.roundOf32;

  total +=
    countCorrectTeams(
      userTips.playoffs?.["round-of-16"],
      actualResults.roundOf16
    ) * POINTS.roundOf16;

  total +=
    countCorrectTeams(
      userTips.playoffs?.quarterfinals,
      actualResults.quarterfinals
    ) * POINTS.quarterfinal;

  total +=
    countCorrectTeams(
      userTips.playoffs?.semifinals,
      actualResults.semifinals
    ) * POINTS.semifinal;

  total +=
    countCorrectTeams(
      userTips.playoffs?.final,
      actualResults.final
    ) * POINTS.final;

  /**
   * =========================
   * WINNER
   * =========================
   */

  const predictedWinner = userTips.playoffs?.winner?.["0"] || userTips.playoffs?.winner?.[0];

  if (
    predictedWinner &&
    predictedWinner === actualResults.winner
  ) {
    total += POINTS.winner;
  }

  /**
   * =========================
   * TOP SCORER
   * =========================
   */

  if (
    userTips.topScorer && 
    actualResults.topScorer && 
    userTips.topScorer.trim().toLowerCase() === actualResults.topScorer.trim().toLowerCase()
  ) {
    total += POINTS.topScorer;
  }

  // SÄKERHETSSPÄRR: Räkna bara poäng om skytteligavinnaren faktiskt har gjort minst 1 mål i facit!
  if (
    actualResults.topScorerGoals > 0 &&
    Number(userTips.goals) === Number(actualResults.topScorerGoals)
  ) {
    total += POINTS.topScorerGoals;
  }

  return total;
}

/**
 * =========================
 * ACTUAL RESULTS (DYNAMIC)
 * =========================
 */

// Denna hålls tom här och fylls på i Firebase när VM startar!
export let actualResults = {
  roundOf32: [],
  roundOf16: [],
  quarterfinals: [],
  semifinals: [],
  final: [],
  winner: "",
  topScorer: "",
  topScorerGoals: 0
};

// Funktion för att uppdatera facit i minnet från main.js
export function setActualResults(newResults) {
  if (newResults) {
    actualResults = newResults;
  }
}