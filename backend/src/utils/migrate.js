'use strict';
// Explicit maintenance command. Back up MongoDB before applying to a live site.
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Chapter = require('../models/Chapter');
const Series = require('../models/Series');
const Bookmark = require('../models/Bookmark');

async function migrate() {
  if (!process.env.MONGODB_URI) throw new Error('Configure MONGODB_URI first.');
  await mongoose.connect(process.env.MONGODB_URI);
  let users = 0; let chapters = 0;
  for await (const user of User.find().select('readingProgress').cursor()) {
    const latest = new Map();
    for (const entry of [...user.readingProgress].sort((a, b) => new Date(a.updatedAt || 0) - new Date(b.updatedAt || 0))) if (entry.seriesId) latest.set(String(entry.seriesId), entry.toObject());
    if (latest.size !== user.readingProgress.length) { await User.updateOne({ _id: user._id }, { $set: { readingProgress: [...latest.values()] } }); users++; }
  }
  for await (const chapter of Chapter.find().select('pages pageCount').cursor()) {
    const pages = [...chapter.pages].sort((a, b) => a.order - b.order).map((page, index) => ({ ...page.toObject(), order: index + 1 }));
    await Chapter.updateOne({ _id: chapter._id }, { $set: { pages, pageCount: pages.length } }); chapters++;
  }
  for await (const series of Series.find().select('_id').cursor()) await Series.updateOne({ _id: series._id }, { $set: { chapterCount: await Chapter.countDocuments({ seriesId: series._id }), bookmarkCount: await Bookmark.countDocuments({ seriesId: series._id }) } });
  console.log(`Repaired ${users} users with duplicate progress records and ${chapters} chapter page lists; refreshed series counts.`);
}
migrate().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
