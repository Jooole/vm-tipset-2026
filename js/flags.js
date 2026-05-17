/**
 * =========================
 * FLAGS MODULE
 * =========================
 * Ansvar:
 * - Konverterar landskoder (ISO3 / FIFA codes)
 *   till flaggbilder från flagcdn.com
 * - Ingen UI-logik
 */

export function getFlag(code) {
  if (!code) return "";

  const c = code.trim().toUpperCase();

  const map = {
    MEX: "mx",
    BRA: "br",
    ARG: "ar",
    SWE: "se",

    GER: "de",
    FRA: "fr",
    ESP: "es",
    ITA: "it",
    ENG: "gb",
    SCO: "gb",
    WAL: "gb",
    NIR: "gb",

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

return `https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/3.5.0/flags/4x3/${iso2}.svg`;
}