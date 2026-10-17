// Mobile destinations already present in the bottom bar or account/notification buttons
// stay out of More. Each remaining link has one clear purpose.
export const moreGroups = [
  { title: 'Your reading', links: [['saved-pages', 'Saved pages', 'bookmark'], ['wishlist', 'Read later', 'heart'], ['history', 'Reading history', 'history'], ['notifications', 'Notifications', 'bell']] },
  { title: 'Discover', links: [['rankings', 'Rankings', 'chart'], ['genres', 'Genres', 'grid'], ['community', 'Community', 'message']] },
  { title: 'Preferences & support', links: [['settings', 'Reader preferences', 'settings'], ['security', 'Security & recovery', 'user'], ['device-data', 'Device backup', 'download'], ['help', 'Reader guide & support', 'message']] },
];
