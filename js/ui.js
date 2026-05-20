/**
 * =========================
 * UI MODULE
 * =========================
 * Ansvar:
 * - Navigation mellan sidor
 * - Countdown timer
 * - All generell UI-logik som inte är matcher
 */

export function initNavigation() {
  const navButtons = document.querySelectorAll(".nav-btn");
  const pages = document.querySelectorAll(".page");
  const ctaButton = document.getElementById("cta-btn");

// Central funktion som läser av URL-hashen och visar rätt sida
  function navigateFromHash() {
    const currentHash = window.location.hash.replace("#", "") || "hem"; // "home" är startsidan

    // Dölj alla sidor och avmarkera alla knappar
    pages.forEach(p => p.classList.remove("active"));
    navButtons.forEach(b => b.classList.remove("active"));

    // Visa den sida och markera den knapp som matchar hashen
    document.getElementById(currentHash)?.classList.add("active");
    document.querySelector(`[data-page="${currentHash}"]`)?.classList.add("active");
  }

  // Knapparna uppdaterar bara URL:en nu
  navButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      window.location.hash = btn.dataset.page;
    });
  });

  // CTA-knappen uppdaterar också bara URL:en
  ctaButton?.addEventListener("click", () => {
    window.location.hash = "mitt-tips";
  });

//Öppna/stänga main menu på mobil
const menuToggle = document.getElementById("menu-toggle");
const mainNav = document.getElementById("main-nav");

menuToggle?.addEventListener("click", () => {
  mainNav.classList.toggle("open");
});

document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    mainNav.classList.remove("open");
  });
});
// Lyssna på om hashen ändras (t.ex. om man trycker bakåt/framåt i webbläsaren)
  window.addEventListener("hashchange", navigateFromHash);

  // Kör direkt vid uppstart så att man hamnar rätt vid en refresh/omladdning
  navigateFromHash();
}

export function initCountdown() {
  const countdownElement = document.getElementById("countdown");
  const worldCupStart = new Date("2026-06-11T20:00:00");

  function updateCountdown() {
    if (!countdownElement) return;

    const now = new Date();
    const diff = worldCupStart - now;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    countdownElement.textContent =
      `${days} dagar ${hours}h ${minutes}m ${seconds}s`;
  }

  updateCountdown();

  // uppdatera varje sekund (för att sekunder ska fungera korrekt)
  setInterval(updateCountdown, 1000);
}