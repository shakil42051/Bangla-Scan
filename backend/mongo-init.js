// Runs only when Docker initializes a new database volume.
db.getSiblingDB('bangla_scan').createUser({ user: 'bangla_scan', pwd: process.env.MONGO_APP_PASSWORD, roles: [{ role: 'readWrite', db: 'bangla_scan' }] });
