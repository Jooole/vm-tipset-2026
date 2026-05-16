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

  navButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.page;

      pages.forEach(p => p.classList.remove("active"));
      navButtons.forEach(b => b.classList.remove("active"));

      document.getElementById(target)?.classList.add("active");
      btn.classList.add("active");
    });
  });

  ctaButton?.addEventListener("click", () => {
    pages.forEach(p => p.classList.remove("active"));
    navButtons.forEach(b => b.classList.remove("active"));

    document.getElementById("betting")?.classList.add("active");
    document.querySelector('[data-page="betting"]')?.classList.add("active");
  });
}

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
      `${days} dagar ${hours} timmar ${minutes} minuter ${seconds} sekunder`;
  }

  updateCountdown();

  // uppdatera varje sekund (för att sekunder ska fungera korrekt)
  setInterval(updateCountdown, 1000);
}