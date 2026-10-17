'use strict';
require('dotenv').config({ path: process.env.BANGLA_SCAN_ENV_FILE || require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
async function seed() {
  try { await mongoose.connect(process.env.MONGODB_URI); await require('../services/seedData')(); console.log('Administrator and comic genres are ready.'); }
  finally { await mongoose.disconnect(); }
}
seed().catch(error => { console.error(error.message); process.exitCode = 1; });
