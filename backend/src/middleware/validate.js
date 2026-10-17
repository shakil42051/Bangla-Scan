'use strict';
const { validationResult } = require('express-validator');

/**
 * Runs express-validator result check.
 * If there are errors, returns 422 with formatted messages.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: errors.array()[0]?.msg || 'Validation failed.',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

module.exports = validate;
