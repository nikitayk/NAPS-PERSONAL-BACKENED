const { v4: uuidv4 } = require("uuid");

/**
 * Generate a new UUID (v4)
 * @returns {string}
 */
function generateUUID() {
  return uuidv4();
}

module.exports = {
  generateUUID,
};
