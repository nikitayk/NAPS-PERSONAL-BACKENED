const Validator = require('validatorjs');
const Models = require('../models');

/**
 * Validate data against rules using validatorjs
 * @param {Object} data - Data to validate
 * @param {Object} rules - Validation rules
 * @param {Object} [customMessages] - Custom error messages
 * @returns {Promise} Resolves if valid, rejects with errors if invalid
 */
function validate(data, rules, customMessages = {}) {
  return new Promise((resolve, reject) => {
    const validation = new Validator(data, rules, customMessages);

    validation.passes(() => resolve());
    validation.fails(() => reject(validation.errors.all()));
  });
}

// Example of async custom rule to check uniqueness in DB
Validator.registerAsync('exist', function(value, attribute, req, passes) {
  if (!attribute) throw new Error('Specify table,column for exist validation');

  const [table, column] = attribute.split(',');
  if (!Models[table]) throw new Error(`Model ${table} not found`);

  Models[table].exists({ [column]: value }).then(exists => {
    if (exists) {
      passes(false, `${column} already in use`);
    } else {
      passes();
    }
  }).catch(() => passes(false, 'Validation error'));
});

module.exports = validate;
