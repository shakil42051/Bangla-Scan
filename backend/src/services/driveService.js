'use strict';
/**
 * driveService.js — Thin compatibility wrapper around DriveManager.
 *
 * All Drive logic now lives in services/driveManager.js.
 * Existing code that imports from driveService continues to work unchanged.
 */

const DriveManager = require('./driveManager');

// ── Legacy named exports (unchanged API) ──────────────────────────────────────

const uploadToDrive = (buffer, fileName, mimeType, folderId = null) =>
  require('./storageProvider').upload(buffer, fileName, mimeType, folderId);

const deleteFromDrive = (fileId, driveAccountId) =>
  require('./storageProvider').remove(fileId, driveAccountId);

const listDriveFiles = (driveAccountId, folderId) =>
  DriveManager.listFiles(driveAccountId, folderId);

const getDriveAccountsSummary = () =>
  DriveManager.getSummary();

// Keep these for any code still using them directly
const buildDriveClient = async (account) => {
  return DriveManager.getClient(String(account._id));
};

const pickBestDrive = () =>
  DriveManager.pickBestDrive();

module.exports = {
  uploadToDrive,
  deleteFromDrive,
  listDriveFiles,
  getDriveAccountsSummary,
  buildDriveClient,
  pickBestDrive,
};
