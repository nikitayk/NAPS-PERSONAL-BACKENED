const _ = require("lodash");

/**
 * Deep clone an object or array safely
 * @param {Object|Array} obj
 * @returns {Object|Array}
 */
function deepClone(obj) {
  return _.cloneDeep(obj);
}

/**
 * Pick only specified keys from an object
 * @param {Object} obj
 * @param {string[]} keys
 * @returns {Object}
 */
function pickKeys(obj, keys) {
  return _.pick(obj, keys);
}

/**
 * Remove keys with null or undefined values from an object
 * @param {Object} obj
 * @returns {Object}
 */
function omitEmpty(obj) {
  return _.omitBy(obj, (value) => value === null || value === undefined);
}

/**
 * Merge two objects deeply with lodash's merge
 * @param {Object} target
 * @param {Object} source
 * @returns {Object}
 */
function deepMerge(target, source) {
  return _.merge({}, target, source);
}

/**
 * Check if an object is empty (no own enumerable properties)
 * @param {Object} obj
 * @returns {boolean}
 */
function isEmptyObject(obj) {
  return _.isEmpty(obj);
}

module.exports = {
  deepClone,
  pickKeys,
  omitEmpty,
  deepMerge,
  isEmptyObject,
};
