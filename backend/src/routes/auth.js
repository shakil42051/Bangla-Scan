'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { body } = require('express-validator');
const recoveryInput = [body('email').isString().trim().isLength({ max: 254 }).isEmail(), body('account').optional().isIn(['reader', 'team'])];

router.post('/register', ctrl.registerValidation, validate, ctrl.register);
router.post('/login', ctrl.loginValidation, validate, ctrl.login);
router.post('/admin/login', ctrl.adminLoginValidation, validate, ctrl.adminLogin);
router.post('/forgot-password', recoveryInput, validate, ctrl.forgot);
router.post('/forgot-username', recoveryInput, validate, require('../controllers/recoveryController').username);
router.post('/reset-password', [body('token').isString().matches(/^[a-f0-9]{64}$/), body('password').custom(require('../utils/passwordPolicy')).withMessage('Use 12 or more characters and at most 72 UTF-8 bytes.'), body('confirmPassword').optional().custom((value, { req }) => value === req.body.password), body('account').optional().isIn(['reader', 'team']), body('code').optional().isString().isLength({ max: 32 })], validate, ctrl.reset);
router.post('/verify-email', body('token').isString().matches(/^[a-f0-9]{64}$/), validate, ctrl.verifyEmail);
router.post('/send-verification', protect, ctrl.sendVerification);
router.post('/refresh', ctrl.refresh);
router.post('/logout', protect, ctrl.logout);
router.post('/revoke-sessions', protect, ctrl.logout);
router.get('/me', protect, ctrl.me);
router.use('/security', require('./accountSecurity'));

module.exports = router;
