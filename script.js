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