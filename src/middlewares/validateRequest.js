/**
 * Middleware to validate request body, params, or query using a schema.
 * Supports Joi, Yup, Zod, etc.
 * 
 * Usage:
 *   router.post('/endpoint', validateRequest(schema), controller.method);
 */

const validateRequest = (schema, property = 'body') => {
  return (req, res, next) => {
    const data = req[property];
    const { error, value } = schema.validate(data, { abortEarly: false, stripUnknown: true });

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details ? error.details.map(d => d.message) : error.errors || error.message,
      });
    }

    // Replace request data with validated/sanitized data
    req[property] = value;
    next();
  };
};

module.exports = validateRequest;
