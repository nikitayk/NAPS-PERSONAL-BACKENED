const _ = require("lodash");

/**
 * Format a number as currency string (e.g., 1234.56 → "$1,234.56")
 * @param {number} amount
 * @param {string} currencySymbol - default '$'
 * @returns {string}
 */
function formatCurrency(amount, currencySymbol = "$") {
  if (!_.isNumber(amount)) return "";
  return (
    currencySymbol +
    amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,")
  );
}

/**
 * Validate if a string is a valid stock symbol (alphanumeric, 1-5 chars)
 * @param {string} symbol
 * @returns {boolean}
 */
function isValidStockSymbol(symbol) {
  if (!_.isString(symbol)) return false;
  return /^[A-Za-z0-9]{1,5}$/.test(symbol.trim());
}

/**
 * Sanitize input string to prevent XSS by escaping HTML chars
 * @param {string} str
 * @returns {string}
 */
function sanitizeInput(str) {
  if (!_.isString(str)) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Convert ISO Date string to formatted 'YYYY-MM-DD HH:mm:ss'
 * @param {string|Date} dateInput
 * @returns {string}
 */
function formatDateTime(dateInput) {
  const date = new Date(dateInput);
  if (isNaN(date)) return "";
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

module.exports = {
  formatCurrency,
  isValidStockSymbol,
  sanitizeInput,
  formatDateTime,
};
