# Free full-stack deployment

The complete application needs a Node server, a MongoDB database, persistent image storage and a verified email sender. Deploying the frontend alone does not enable login or content uploads.

## Services and limits

- **Render Free web service:** runs Express and serves this frontend on one HTTPS origin. It sleeps after 15 idle minutes, has a cold start, and loses local files on restarts. Scheduled jobs only run while the server is awake. See https://render.com/docs/free.
- **MongoDB Atlas Free:** holds accounts, catalog metadata, reading progress and application settings. Its 512 MB quota is for database data; store comic images separately. See https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/.
- **Supabase Free Storage:** use a private S3-compatible bucket for comic pages. The current free plan includes 1 GB file storage and limited transfer; inactive projects may pause. See https://supabase.com/pricing and https://supabase.com/docs/guides/storage/s3/compatibility.
- **Recovery email:** use a verified transactional sender. Render Free blocks common SMTP ports 25, 465 and 587. A provider supporting STARTTLS on port 2525, such as SMTP2GO or Brevo, can use the existing SMTP configuration. Provider sender verification and quotas still apply. See https://www.smtp2go.com/pricing/ and https://help.brevo.com/hc/en-us/articles/10905415650322.

Choose only free plans and stay within their quotas. Do not add a payment method, activate a paid trial or enable paid overages for this deployment. If a provider requires billing verification, stop and review that requirement with the site owner. This is a small-site setup with limited storage and availability.

## Prepare the database and image bucket

1. In Atlas, create a **Free** cluster and a database user limited to read/write on `bangla_scan`. Configure database network access for the Render service's outbound IP ranges. Copy the connection URI only into Render's private environment settings. URL-encode special characters in its password.
2. In Supabase, use a **Free** project. Create a **private** bucket named `bangla-scan-media`. Never enable public access. Generate S3 credentials for this project and put them only in Render's private environment settings. Keep the endpoint, region and credentials from the project's S3 settings together. Do not use the public browser API key as an S3 secret.

## Create the Render service

Use this repository and `render.yaml` as a Blueprint, or create a **Free Web Service** manually with:

| Setting | Value |
| --- | --- |
| Root directory | repository root (leave blank) |
| Build command | `npm --prefix backend ci --omit=dev` |
| Start command | `node backend/src/hosted.js` |
| Health check | `/ready` |
| Plan | Free |

The Blueprint lists the required private variables and generates distinct application secrets. For manual setup, supply the same variables through the Render dashboard. Use a new strong administrator password, not one shown in a screenshot. Use an email address you control for `ADMIN_EMAIL`.

Hosted startup derives `PUBLIC_URL` and `CLIENT_URL` from Render's HTTPS address. For a custom domain, explicitly set them to that origin. `BOOTSTRAP_ADMIN=true` creates the administrator and default comic genres if missing; it never replaces an existing administrator password. After the first successful initialization, set it to `false` and remove `ADMIN_PASSWORD` from hosting configuration. Keep encryption keys stable across deployments.

The hosted launcher requires external image storage and prevents server-local uploads, including if an administrator selects local storage later. This avoids losing comic pages when the free server sleeps or restarts. The server proxies private images through its existing access checks.

Add `SMTP_HOST`, `SMTP_PORT=2525`, `SMTP_USER`, `SMTP_PASS` and a verified `SMTP_FROM` in Render's private settings, then redeploy. Test password reset and username recovery before opening registration to readers. Without working delivery, account recovery is unavailable.

## Verify before sharing

- `/ready` must return JSON with `status: ready`; `/api/settings` must return JSON, not an HTML error page.
- Sign in with **Content team account** and your new production administrator credentials.
- Create a draft series, upload a small image and chapter, reorder its pages, then publish it. Verify guest reading and the saved content after a restart.
- Test sign-out, sign-in, password recovery, username recovery and MFA with accounts you control.
- Monitor database, storage, bandwidth and email quotas in the provider dashboards. Keep independent backups; a catalog JSON export does not include accounts or image binaries.

Free accounts and their terms/verification steps must be completed by the site owner. Secrets, provider keys, environment files and uploaded media stay outside the repository.
