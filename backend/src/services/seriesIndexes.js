'use strict';

// Replace only the legacy catalog text index; documents and other indexes remain intact.
module.exports = async function ensureSeriesIndexes(Series = require('../models/Series')) {
  await Series.createCollection();
  const indexes = await Series.collection.indexes();
  const name = 'title_text_alternativeTitles_text_description_text';
  const legacy = indexes.find(index => index.name === name);
  if (legacy && (legacy.default_language !== 'none' || legacy.language_override !== 'textSearchLanguage')) {
    await Series.collection.dropIndex(name);
  }
  await Series.createIndexes();
};
