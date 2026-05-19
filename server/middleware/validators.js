// middleware/validators.js - Input validation rules
const { body, validationResult } = require('express-validator');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
      })),
    });
  }
  next();
};

// Auth validation rules
const validateSignup = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters')
    .escape(),
  
  body('email')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail()
    .toLowerCase(),
  
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and numbers'),
  
  body('role')
    .isIn(['vendor', 'supplier']).withMessage('Role must be vendor or supplier'),
  
  handleValidationErrors,
];

const validateLogin = [
  body('email')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail()
    .toLowerCase(),
  
  body('password')
    .notEmpty().withMessage('Password is required'),
  
  handleValidationErrors,
];

// Product validation rules
const validateProduct = [
  body('name')
    .trim()
    .notEmpty().withMessage('Product name is required')
    .isLength({ min: 3, max: 100 }).withMessage('Name must be 3-100 characters')
    .escape(),
  
  body('description')
    .trim()
    .optional()
    .isLength({ max: 1000 }).withMessage('Description too long (max 1000 chars)'),
  
  body('price')
    .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  
  body('quantity')
    .isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  
  body('category')
    .trim()
    .notEmpty().withMessage('Category is required')
    .escape(),
  
  handleValidationErrors,
];

// Order validation rules
const validateOrder = [
  body('items')
    .isArray({ min: 1 }).withMessage('Order must contain at least 1 item'),
  
  body('items.*.productId')
    .notEmpty().withMessage('Product ID is required'),
  
  body('items.*.quantity')
    .isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  
  body('totalAmount')
    .isFloat({ min: 0 }).withMessage('Total amount must be positive'),
  
  handleValidationErrors,
];

module.exports = {
  validateSignup,
  validateLogin,
  validateProduct,
  validateOrder,
  handleValidationErrors,
};
