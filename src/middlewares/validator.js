/**
 * Input Validation Middleware
 * Comprehensive validation for all request types
 */
import { body, param, query, validationResult } from 'express-validator';
import { formatResponse } from '../utils/formatResponse.js';

// UUID validation
export const validateUUID = (field = 'id') => [
  param(field).isUUID().withMessage(`${field} must be a valid UUID`),
  handleValidationErrors,
];

// Query UUID validation
export const validateQueryUUID = (field = 'id') => [
  query(field).optional().isUUID().withMessage(`${field} must be a valid UUID`),
  handleValidationErrors,
];

// Amount validation (decimal, non-negative)
export const validateAmount = [
  body('amount')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),
  handleValidationErrors,
];

// Date validation
export const validateDate = (field = 'date') => [
  body(field)
    .optional()
    .isISO8601()
    .withMessage(`${field} must be a valid ISO 8601 date`),
  handleValidationErrors,
];

// Status enum validation
export const validateStatus = (allowedStatuses = []) => [
  body('status')
    .optional()
    .isIn(allowedStatuses)
    .withMessage(`Status must be one of: ${allowedStatuses.join(', ')}`),
  handleValidationErrors,
];

// Rating validation (1-5)
export const validateRating = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  handleValidationErrors,
];

// Email validation
export const validateEmail = [
  body('email').isEmail().withMessage('Must be a valid email address'),
  handleValidationErrors,
];

// Pagination validation
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors,
];

// Sorting validation
export const validateSorting = (allowedFields = []) => [
  query('sortBy')
    .optional()
    .isIn(allowedFields)
    .withMessage(`sortBy must be one of: ${allowedFields.join(', ')}`),
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('order must be either "asc" or "desc"'),
  handleValidationErrors,
];

// Project creation validation
export const validateProject = [
  body('bid_id').isUUID().withMessage('bid_id must be a valid UUID'),
  body('owner_id').isUUID().withMessage('owner_id must be a valid UUID'),
  body('contractor_id').isUUID().withMessage('contractor_id must be a valid UUID'),
  body('title').trim().notEmpty().withMessage('title is required'),
  body('total_amount')
    .isFloat({ min: 0 })
    .withMessage('total_amount must be a positive number'),
  handleValidationErrors,
];

// Payment creation validation
export const validatePayment = [
  body('project_id').isUUID().withMessage('project_id must be a valid UUID'),
  body('amount')
    .isFloat({ min: 0 })
    .withMessage('amount must be a positive number'),
  body('payment_type')
    .notEmpty()
    .withMessage('payment_type is required'),
  handleValidationErrors,
];

// Bid creation validation
export const validateBid = [
  body('title').trim().notEmpty().withMessage('title is required'),
  body('description').trim().notEmpty().withMessage('description is required'),
  body('due_date')
    .isISO8601()
    .withMessage('due_date must be a valid ISO 8601 date'),
  handleValidationErrors,
];

// Job creation validation
export const validateJob = [
  body('title').trim().notEmpty().withMessage('title is required'),
  body('description').trim().notEmpty().withMessage('description is required'),
  body('location').trim().notEmpty().withMessage('location is required'),
  body('trade_type').trim().notEmpty().withMessage('trade_type is required'),
  handleValidationErrors,
];

// Message validation
export const validateMessage = [
  body('conversation_id')
    .isUUID()
    .withMessage('conversation_id must be a valid UUID'),
  body('receiver_id').isUUID().withMessage('receiver_id must be a valid UUID'),
  body('content').trim().notEmpty().withMessage('content is required'),
  handleValidationErrors,
];

// Review validation
export const validateReview = [
  body('project_id')
    .optional()
    .isUUID()
    .withMessage('project_id must be a valid UUID'),
  body('reviewee_id').isUUID().withMessage('reviewee_id must be a valid UUID'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('rating must be between 1 and 5'),
  handleValidationErrors,
];

// Dispute validation
export const validateDispute = [
  body('project_id').isUUID().withMessage('project_id must be a valid UUID'),
  body('dispute_type').trim().notEmpty().withMessage('dispute_type is required'),
  body('description').trim().notEmpty().withMessage('description is required'),
  handleValidationErrors,
];

// Error handler middleware
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(
      formatResponse(false, 'Validation failed', {
        errors: errors.array(),
      })
    );
  }
  next();
};

// Custom validator for checking if value is in enum
export const isInEnum = (allowedValues) => {
  return (value) => {
    if (!allowedValues.includes(value)) {
      throw new Error(`Value must be one of: ${allowedValues.join(', ')}`);
    }
    return true;
  };
};

// Custom validator for date range
export const validateDateRange = (startField, endField) => [
  body(startField)
    .optional()
    .isISO8601()
    .withMessage(`${startField} must be a valid date`),
  body(endField)
    .optional()
    .isISO8601()
    .withMessage(`${endField} must be a valid date`),
  body(endField).custom((endDate, { req }) => {
    if (endDate && req.body[startField]) {
      if (new Date(endDate) < new Date(req.body[startField])) {
        throw new Error(`${endField} must be after ${startField}`);
      }
    }
    return true;
  }),
  handleValidationErrors,
];

