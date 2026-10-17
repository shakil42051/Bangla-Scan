// Real, persistent MongoDB + media storage. No sample catalog or demo API.
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const require = createRequire(new URL('../backend/package.json', import.meta.url));
const dotenv = require('dotenv'); const { MongoClient } = require('mongoose').mongo;
const root = fileURLToPath(new URL('../', import.meta.url));
const backend = path.join(root, 'backend'); const runtime = path.join(backend, '.runtime');
const configFile = path.join(backend, '.env.local');
const secret = () => randomBytes(32).toString('base64url');
let mongoProcess, httpServer, closing = false;
async function close() {
  if (closing) return; closing = true;
  if (httpServer) await new Promise(resolve => httpServer.close(resolve));
  await require('mongoose').disconnect();
  if (mongoProcess) {
    try { const client = new MongoClient(rootURI); await client.connect(); await client.db('admin').command({ shutdown: 1 }); } catch { /* MongoDB closes its connection during shutdown. */ }
  }
}
let rootURI;
try {
  let config;
  try { config = dotenv.parse(await readFile(configFile)); }
  catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const original = dotenv.parse(await readFile(path.join(backend, '.env')).catch(() => Buffer.from('')));
    const dbPassword = secret(); const rootPassword = secret();
    config = { NODE_ENV: 'development', HOST: '127.0.0.1', PORT: '5000', MONGODB_URI: `mongodb://bangla_scan:${dbPassword}@127.0.0.1:27018/bangla_scan_local?authSource=admin`, LOCAL_MONGO_ROOT_PASSWORD: rootPassword, JWT_SECRET: secret(), JWT_REFRESH_SECRET: secret(), ADMIN_EMAIL: original.ADMIN_EMAIL || 'owner@banglascan.local', ADMIN_PASSWORD: secret(), ADMIN_NAME: 'Site owner', STORAGE_DRIVER: 'local', MEDIA_DIRECTORY: path.join(backend, 'data', 'media'), PUBLIC_URL: 'http://localhost:5000', CLIENT_URL: 'http://localhost:5000,http://localhost:3000', MAX_FILE_SIZE_MB: '10' };
    await writeFile(configFile, Object.entries(config).map(([k, v]) => `${k}=${v}`).join('\n') + '\n', { flag: 'wx', mode: 0o600 });
    console.log('Created backend/.env.local with private local credentials. Existing backend/.env was preserved.');
  }
  Object.assign(process.env, config, { BANGLA_SCAN_ENV_FILE: configFile, BOOTSTRAP_LOCAL_ADMIN: 'true' });
  rootURI = `mongodb://local_owner:${encodeURIComponent(config.LOCAL_MONGO_ROOT_PASSWORD)}@127.0.0.1:27018/admin`;
  let binary = process.env.MONGOD_BINARY || (await readFile(path.join(runtime, 'mongod-path.txt'), 'utf8').catch(() => '')).replace(/^\uFEFF/, '').trim() || path.join(runtime, 'mongodb-win32-x86_64-windows-8.0.34', 'bin', 'mongod.exe');
  try { await access(binary); }
  catch {
    if (process.platform !== 'win32') throw new Error('Set MONGOD_BINARY to an installed MongoDB Community mongod binary.');
    console.log('Preparing the verified official MongoDB runtime…');
    await new Promise((resolve, reject) => { const installer = spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', path.join(root, 'scripts/install-local-mongo.ps1')], { cwd: root, stdio: 'inherit', windowsHide: true }); installer.on('error', reject); installer.on('exit', code => code === 0 ? resolve() : reject(new Error('MongoDB runtime setup failed.'))); });
  }
  if (!process.env.MONGOD_BINARY) binary = (await readFile(path.join(runtime, 'mongod-path.txt'), 'utf8').catch(() => binary)).replace(/^\uFEFF/, '').trim();
  const dbPath = path.join(runtime, 'database'); await mkdir(dbPath, { recursive: true });
  // Reuse only a database authenticated by this project's private root credentials.
  let client = new MongoClient(rootURI, { serverSelectionTimeoutMS: 1000 });
  try { await client.connect(); }
  catch {
    await client.close();
    mongoProcess = spawn(binary, ['--dbpath', dbPath, '--bind_ip', '127.0.0.1', '--port', '27018', '--auth', '--logpath', path.join(runtime, 'mongod.log'), '--logappend', '--wiredTigerCacheSizeGB', '0.25'], { stdio: 'ignore', windowsHide: true });
    let exited; mongoProcess.on('error', error => { exited = error; }); mongoProcess.on('exit', code => { exited ||= new Error('Local MongoDB stopped (' + code + '). Check backend/.runtime/mongod.log.'); });
    let ready = false;
    for (let i = 0; i < 60; i++) {
      if (exited) throw exited;
      const probe = new MongoClient('mongodb://127.0.0.1:27018/admin', { serverSelectionTimeoutMS: 500 });
      try { await probe.connect(); await probe.db('admin').command({ ping: 1 }); ready = true; await probe.close(); break; }
      catch { await probe.close(); await new Promise(resolve => setTimeout(resolve, 500)); }
    }
    if (!ready) throw new Error('Local MongoDB did not become ready. Check backend/.runtime/mongod.log.');
    client = new MongoClient(rootURI, { serverSelectionTimeoutMS: 2000 });
    try { await client.connect(); }
    catch (error) {
      await client.close();
      // MongoDB's localhost exception allows this only when no users exist.
      const setup = new MongoClient('mongodb://127.0.0.1:27018/admin'); await setup.connect();
      try { await setup.db('admin').command({ createUser: 'local_owner', pwd: config.LOCAL_MONGO_ROOT_PASSWORD, roles: ['root'] }); }
      finally { await setup.close(); }
      client = new MongoClient(rootURI); await client.connect();
    }
  }
  const appUsername = decodeURIComponent(new URL(config.MONGODB_URI).username);
  const appPassword = decodeURIComponent(new URL(config.MONGODB_URI).password);
  const users = await client.db('admin').command({ usersInfo: appUsername });
  if (!users.users.length) await client.db('admin').command({ createUser: appUsername, pwd: appPassword, roles: [{ role: 'readWrite', db: 'bangla_scan_local' }] });
  await client.close();
  httpServer = await require('../backend/src/server').start();
  console.log('Real comic website and admin: http://localhost:5000');
  console.log('Sign in with ADMIN_EMAIL and ADMIN_PASSWORD from backend/.env.local (Content team sign in).');
  console.log('Catalog and accounts persist in backend/.runtime/database; uploaded images persist in backend/data/media.');
  process.on('SIGINT', () => close().then(() => process.exit(0)));
  process.on('SIGTERM', () => close().then(() => process.exit(0)));
} catch (error) {
  // Do not expose database URIs or generated passwords in diagnostics.
  console.error(error.code === 'EADDRINUSE' ? 'The website port is already in use. Open the running site or choose a free PORT in backend/.env.local.' : 'Local startup failed. Check database/runtime logs and backend/.env.local. ' + (error.code || error.name || ''));
  await close().catch(() => {}); process.exitCode = 1;
}
