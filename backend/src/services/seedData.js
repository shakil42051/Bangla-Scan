'use strict';
const Admin = require('../models/Admin');
const Genre = require('../models/Genre');
const Settings = require('../models/Settings');
const logger = require('../utils/logger');
const defaultGenres = [
  { name: 'Action', icon: '⚔️', color: '#ef4444', order: 1 },
  { name: 'Adventure', icon: '🗺️', color: '#f59e0b', order: 2 },
  { name: 'Romance', icon: '💕', color: '#ec4899', order: 3 },
  { name: 'Fantasy', icon: '🔮', color: '#7c3aed', order: 4 },
  { name: 'Sci-Fi', icon: '🚀', color: '#06b6d4', order: 5 },
  { name: 'Horror', icon: '👻', color: '#1f2937', order: 6 },
  { name: 'Comedy', icon: '😂', color: '#f97316', order: 7 },
  { name: 'Drama', icon: '🎭', color: '#3b82f6', order: 8 },
  { name: 'Slice of Life', icon: '🌸', color: '#10b981', order: 9 },
  { name: 'Supernatural', icon: '✨', color: '#8b5cf6', order: 10 },
  { name: 'Martial Arts', icon: '🥋', color: '#dc2626', order: 11 },
  { name: 'Isekai', icon: '🌀', color: '#6366f1', order: 12 },
  { name: 'Mystery', icon: '🔍', color: '#374151', order: 13 },
  { name: 'School', icon: '🏫', color: '#0891b2', order: 14 },
  { name: 'Sports', icon: '⚽', color: '#16a34a', order: 15 },
  { name: 'Historical', icon: '📜', color: '#92400e', order: 16 },
  { name: 'Psychological', icon: '🧠', color: '#7c2d12', order: 17 },
  { name: 'Mecha', icon: '🤖', color: '#64748b', order: 18 },
  { name: 'Music', icon: '🎵', color: '#db2777', order: 19 },
  { name: 'Cooking', icon: '🍜', color: '#d97706', order: 20 },
];

module.exports = async function seedData() {
  if (!process.env.ADMIN_EMAIL || (process.env.ADMIN_PASSWORD || '').length < 12 || !require('../utils/passwordPolicy')(process.env.ADMIN_PASSWORD)) throw new Error('Configure ADMIN_EMAIL and an ADMIN_PASSWORD of at least 12 characters and at most 72 UTF-8 bytes.');
    // ── Create super admin ──────────────────────────────────────────────────
    const adminEmail = process.env.ADMIN_EMAIL;
    const existingAdmin = await Admin.findOne({ email: adminEmail });

    if (!existingAdmin) {
      await Admin.create({
        name: process.env.ADMIN_NAME || 'Super Admin',
        email: adminEmail,
        passwordHash: process.env.ADMIN_PASSWORD,
        role: 'super_admin',
        permissions: {
          manageSeries: true, manageChapters: true, manageUsers: true,
          manageAdmins: true, manageSettings: true, viewAnalytics: true,
          manageHomepage: true, deleteContent: true,
        },
      });
      logger.info(`✅ Super admin created: ${adminEmail}`);
    } else {
      logger.info(`⏩ Super admin already exists: ${adminEmail}`);
    }

    // ── Create genres ───────────────────────────────────────────────────────
    let genresCreated = 0;
    for (const genreData of defaultGenres) {
      const exists = await Genre.findOne({ name: genreData.name });
      if (!exists) {
        await Genre.create(genreData);
        genresCreated++;
      }
    }
    logger.info(`✅ ${genresCreated} genres created (${defaultGenres.length - genresCreated} already existed)`);

    // ── Create default settings ─────────────────────────────────────────────
    const settings = await Settings.findById('global');
    if (!settings) {
      await Settings.create({ _id: 'global' });
      logger.info('✅ Default settings created.');
    } else {
      logger.info('⏩ Settings already exist.');
    }

};
