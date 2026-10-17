'use strict';
const nodemailer = require('nodemailer');
const crypto = require('crypto');
let transport, signature;
const configured = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
const escape = value => String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
function link(route, values = {}, base = process.env.PUBLIC_URL || 'http://localhost:5000') {
  const url = new URL(base);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || (process.env.NODE_ENV === 'production' && url.protocol !== 'https:')) throw new Error('Configure a trusted HTTPS PUBLIC_URL for account recovery.');
  url.search = ''; url.hash = '/' + route + (Object.keys(values).length ? '?' + new URLSearchParams(values) : ''); return url.href;
}
async function sendMail({ to, subject, html, text }) {
  if (!configured()) throw new Error('SMTP is not configured.');
  const port = Number(process.env.SMTP_PORT) || 587;
  const options = { host: process.env.SMTP_HOST, port, secure: port === 465, requireTLS: process.env.NODE_ENV === 'production', auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }, connectionTimeout: 5000, greetingTimeout: 5000, socketTimeout: 10000, disableFileAccess: true, disableUrlAccess: true };
  const next = crypto.createHash('sha256').update(JSON.stringify(options)).digest('hex');
  if (!transport || signature !== next) { transport?.close(); transport = nodemailer.createTransport(options); signature = next; }
  return transport.sendMail({ from: process.env.SMTP_FROM || 'Bangla Scan <noreply@example.com>', to, subject, html, text });
}
function message(to, subject, paragraph, url) {
  return sendMail({ to, subject, text: paragraph + (url ? '\n\n' + url : '') + '\n\nIf you did not request this, contact the site team.', html: '<div style="font:16px/1.6 system-ui;padding:24px"><h2>' + escape(subject) + '</h2><p>' + escape(paragraph) + '</p>' + (url ? '<p><a href="' + escape(url) + '">Continue securely</a></p>' : '') + '<p>If you did not request this, contact the site team.</p></div>' });
}
const sendPasswordResetMail = (to, token, base, actor = 'user') => message(to, 'Reset your Bangla Scan password', 'This single-use link expires in 30 minutes. Your authenticator or a recovery code is also required if two-step verification is enabled.', link('reset-password', { token, account: actor === 'admin' ? 'team' : 'reader' }, base));
const sendVerificationMail = (to, token, base) => message(to, 'Verify your Bangla Scan email', 'Verify your email with this single-use link. It expires in 24 hours.', link('verify-email', { token }, base));
const sendUsernameReminder = (to, username) => message(to, 'Your Bangla Scan username', 'Your username is: ' + username + '. You can also sign in with this email address.', link('login'));
const sendSecurityNotice = (to, action) => message(to, 'Bangla Scan account security update', action, link('login'));
// Mail delivery happens after the generic recovery response, so SMTP latency/failures
// cannot reveal whether an account exists. Tokens are never written to application logs.
const pending = []; let running = 0;
function pump() {
  while (running < 2 && pending.length) { const task = pending.shift(); running++; Promise.resolve().then(task).catch(() => require('../utils/logger').warn('Account email delivery failed. Check private SMTP configuration.')).finally(() => { running--; pump(); }); }
}
function queue(task) { if (pending.length >= 40) return false; pending.push(task); setImmediate(pump); return true; }
module.exports = { configured, sendMail, sendPasswordResetMail, sendVerificationMail, sendUsernameReminder, sendSecurityNotice, queue, link };
