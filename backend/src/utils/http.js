'use strict';
const fail = (statusCode, message) => Object.assign(new Error(message), { statusCode, expose: statusCode < 500 || statusCode === 503 });
const pagination = (query, max = 100) => ({
  page: Math.min(100000, Math.max(1, Math.floor(Number.isFinite(Number(query.page)) ? Number(query.page) || 1 : 1))),
  limit: Math.min(max, Math.max(1, Math.floor(Number(query.limit) || 20))),
});
module.exports = { fail, pagination };
