import { login } from "./firebase.js";

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const btn = document.getElementById("login-btn");
const errorText = document.getElementById("error");

btn.addEventListener("click", async () => {
  try {
    const email = emailInput.value;
    const password = passwordInput.value;

    await login(email, password);

    // skickar vidare till huvudappen
    window.location.href = "index.html";

  } catch (err) {
    errorText.textContent = "Fel email eller lösenord";
  }
});