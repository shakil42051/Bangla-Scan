# Security policy

## Report a vulnerability

Use the repository's **Security → Advisories → Report a vulnerability** option when private vulnerability reporting is enabled. Do not post passwords, tokens, private configuration, account data or exploitable security details in a public issue. If private reporting is unavailable, open an issue requesting a private contact without including those details.

## Deployment responsibilities

- Keep real `.env` files, service-account credentials, private keys, database files, backups and uploaded media outside Git. `backend/.env.example` contains configuration names and placeholders only.
- Supply production secrets through the hosting provider's private environment settings. Use distinct random JWT secrets and stable encryption keys; keep encrypted credential backups with the corresponding keys.
- Serve the application over HTTPS with a managed MongoDB connection or the authenticated internal database in Docker Compose. Keep MongoDB and storage buckets private.
- Host the frontend and API on the same origin so private comic media and authentication work together. GitHub Pages alone cannot run this Node.js backend.
- Configure recovery email before allowing public signup. Verify password reset, username recovery and MFA recovery in the deployed environment.
- Keep dependencies updated, review automated checks, and back up the database and media before upgrades.

See `SECURITY_REVIEW.md` for implemented protections and verification limits, and `README.md` for setup and deployment instructions. A passing test suite is not a guarantee that every vulnerability has been eliminated.
