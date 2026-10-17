'use strict';
const common = new Set(['password1234', 'password12345', '123456789012', 'qwerty123456', 'banglascan123', 'letmein123456']);
module.exports = value => typeof value === 'string' && value.length >= 12 && Buffer.byteLength(value, 'utf8') <= 72 && !/^(.)\1{11,}$/u.test(value) && !common.has(value.trim().toLowerCase());
