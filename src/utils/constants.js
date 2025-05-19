// src/utils/constants.js

// HTTP Methods
const HTTP_METHODS = Object.freeze({
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
});

// API Endpoints/Base URLs
const API = Object.freeze({
  BASE_URL: 'https://api.example.com',
});

// Error Messages
const ERROR_MESSAGES = Object.freeze({
  ENTITY_NOT_FOUND: 'Entity not found!',
  INVALID_QUERY: 'Invalid query parameters!',
  AUTH_FAILED: 'Authentication failed!',
  VALIDATION_ERROR: 'Validation error',
  SERVER_ERROR: 'Internal server error',
});

// User Roles
const USER_ROLES = Object.freeze({
  USER: 'user',
  ADMIN: 'admin',
});

// Status Codes
const STATUS_CODES = Object.freeze({
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
});

// Export all constants as a single object
module.exports = {
  HTTP_METHODS,
  API,
  ERROR_MESSAGES,
  USER_ROLES,
  STATUS_CODES,
};
