'use strict';
const Bookmark = require('../models/Bookmark');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Series = require('../models/Series');
module.exports = async chapter => {
  if (chapter.visibility !== 'public') return;
  const series = await Series.findOne({ _id: chapter.seriesId, visibility: 'public' }).select('title');
  if (!series) return;
  const followers = await Bookmark.find({ seriesId: series._id, status: { $in: ['reading', 'plan_to_read', 'on_hold'] } }).select('userId').lean();
  const eligible = new Set((await User.distinct('_id', { _id: { $in: followers.map(f => f.userId) }, isActive: true, 'preferences.newChapterAlerts': { $ne: false } })).map(String));
  const recipients = followers.filter(f => eligible.has(String(f.userId)));
  if (!recipients.length) return;
  await Notification.bulkWrite(recipients.map(({ userId }) => ({ updateOne: {
    filter: { userId, chapterId: chapter._id, type: 'new_chapter' },
    update: { $setOnInsert: { userId, type: 'new_chapter', seriesId: series._id, chapterId: chapter._id, title: `${series.title} · Chapter ${chapter.chapterNumber}`, body: chapter.title || 'A new chapter is available.', link: `/#/read/${series._id}/${chapter.chapterNumber}`, isRead: false } }, upsert: true,
  } })));
};
