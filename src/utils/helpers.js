// src/utils/helpers.js

/**
 * Formats a consistent API response.
 * @param {boolean} success
 * @param {object|null} data
 * @param {string} message
 * @returns {object}
 */
function formatResponse(success, data, message) {
  return { success, data, message };
}

/**
 * Picks specific fields from an object.
 * @param {object} obj
 * @param {string[]} fields
 * @returns {object}
 */
function pick(obj, fields) {
  return fields.reduce((acc, field) => {
    if (obj && Object.prototype.hasOwnProperty.call(obj, field)) {
      acc[field] = obj[field];
    }
    return acc;
  }, {});
}

/**
 * Generates a random integer between min and max (inclusive).
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = {
  formatResponse,
  pick,
  getRandomInt,
};
