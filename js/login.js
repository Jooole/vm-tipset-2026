import { login } from "./firebase.js";

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const btn = document.getElementById("login-btn");
const errorText = document.getElementById("error");

btn.addEventListener("click", async (e) => {
  e.preventDefault(); // 🔥 VIKTIG FIX (stoppar form submit/reload)
  console.log("LOGIN BUTTON CLICKED");
  try {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const result = await login(email, password);
    console.log("FIREBASE RESULT:", result);
    console.log("LOGIN SUCCESS:", result.user);

    window.location.href = "index.html";

  } catch (err) {
    console.error("LOGIN ERROR:", err.code, err.message);

    errorText.textContent = err.message || "Fel email eller lösenord";
  }
});