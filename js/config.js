/**
 * =========================
 * TOGGLE BETWEEN PROD AND DEV MODE
 * =========================
 */
const DEV_MODE = true;

/**
 * =========================
 * ADMIN USERS
 * =========================
 */

// Staffan och Joels UUID:s
export const ALLOWED_ADMINS = [
  "v0ZTH8NitNMhEGWRLt35Kkfja4k2",
  "NJEOKLuqUUNWjoDMvXrsMAlSFE12"
];

/**
 * Kontrollerar om en inloggad användare har administratörsbehörighet
 * @param {string} uid - Användarens unika Firebase UID
 * @returns {boolean}
 */
export function checkIsAdmin(uid) {
  if (!uid) return false;
  return ALLOWED_ADMINS.includes(uid);
}