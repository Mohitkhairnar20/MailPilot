# MailPilot

MailPilot is a full-stack AI email automation platform for creating, personalizing, scheduling, and tracking outbound email campaigns.

It includes:
- A React + Vite frontend for campaign operations
- An Express API for auth, campaign/contact/template management
- A Redis + BullMQ background queue and worker for reliable email delivery
- MongoDB for persistence
- OpenAI-assisted template generation and recipient personalization

## Core Features

- JWT auth (email/password) and Google sign-in
- Guided campaign wizard with variable preview (`{{name}}`, `{{firstName}}`, `{{email}}`, `{{company}}`, `{{role}}`)
- Bulk CSV upload + per-recipient AI personalization
- Campaign delivery modes: `draft`, `processing` (send now), `scheduled`
- Worker-based sending with retries and failure tracking
- Contacts and templates management
- Delivery logs and analytics dashboard

## Tech Stack

- Frontend: React 18, React Router, Vite, Tailwind CSS, Axios, Recharts
- Backend: Node.js, Express, Mongoose, JWT, Nodemailer, node-cron
- Queue/Worker: BullMQ + ioredis
- Database: MongoDB
- Cache/Queue Backend: Redis
- AI: OpenAI API (`gpt-4o-mini` default)

## Monorepo Structure

```text
MailPilot/
|-- backend/
|   |-- src/
|   |   |-- config/
|   |   |-- controllers/
|   |   |-- middleware/
|   |   |-- models/
|   |   |-- queues/
|   |   |-- routes/
|   |   |-- services/
|   |   |-- workers/
|   |   |-- app.js
|   |   `-- server.js
|   |-- package.json
|   `-- .env
|-- frontend/
|   |-- src/
|   |-- public/
|   |-- package.json
|   `-- .env
|-- render.yaml
|-- package.json
`-- README.md
```

## Prerequisites

- Node.js 18+
- npm 9+
- MongoDB instance (Atlas or local)
- Redis instance (local or managed)
- SMTP provider credentials (Brevo/Mailtrap/etc.)
- OpenAI API key (optional but recommended)
- Google OAuth Client ID (optional, for Google sign-in)

## Installation

From repository root:

```bash
npm run install:all
```

## Environment Variables

Use placeholders only. Do not commit real secrets.

### Backend (`backend/.env`)

```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>/<db>
JWT_SECRET=<strong-random-secret>
JWT_EXPIRES_IN=7d

# Redis (recommended)
REDIS_URL=redis://<user>:<password>@<host>:<port>

# Or local Redis fallback fields if REDIS_URL is not set
# REDIS_HOST=127.0.0.1
# REDIS_PORT=6379
# REDIS_USERNAME=
# REDIS_PASSWORD=

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=<smtp-user>
SMTP_PASS=<smtp-password>
SMTP_FROM="MailPilot <no-reply@example.com>"

EMAIL_JOB_ATTEMPTS=3
EMAIL_JOB_BACKOFF_MS=5000
EMAIL_WORKER_CONCURRENCY=5

OPENAI_API_KEY=<openai-api-key>
OPENAI_MODEL=gpt-4o-mini

# Comma-separated allowed origins for CORS
CLIENT_URL=http://localhost:5173

# Optional: required only for Google Sign-In
GOOGLE_CLIENT_ID=<google-oauth-client-id>
```

### Frontend (`frontend/.env`)

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=<google-oauth-client-id>
```

## Running Locally

Run API + worker + frontend together:

```bash
npm run dev
```

Services:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`
- Health check: `GET /api/health`

You can also run services independently:

```bash
npm run dev:backend
npm run dev:worker
npm run dev:frontend
```

## Scripts

### Root

- `npm run install:all` - Install root + workspace dependencies
- `npm run dev` - Start backend, worker, and frontend concurrently
- `npm run build` - Build frontend only
- `npm run start` - Start backend in production mode

### Backend

- `npm run dev --workspace backend` - Start API with nodemon
- `npm run start --workspace backend` - Start API with node
- `npm run worker --workspace backend` - Start email worker
- `npm run dev:worker --workspace backend` - Start worker with nodemon

### Frontend

- `npm run dev --workspace frontend`
- `npm run build --workspace frontend`
- `npm run preview --workspace frontend`

## CI/CD Pipeline

This repository now includes GitHub Actions workflows in `.github/workflows`:

- `ci.yml` runs on pull requests and pushes to `main`, `master`, and `develop`
- `deploy-render.yml` triggers Render deployments after CI succeeds on pushes to `main`, or manually through GitHub Actions

### CI checks

The CI workflow currently performs:

- dependency installation with `npm ci`
- backend JavaScript syntax validation with `npm run ci:backend`
- frontend production build with `npm run ci:frontend`

This gives the project a reliable baseline pipeline even before linting and automated tests are added.

### Required GitHub Secrets For CD

Add these repository secrets before enabling deployment:

- `RENDER_API_DEPLOY_HOOK`
- `RENDER_WORKER_DEPLOY_HOOK`
- `RENDER_WEB_DEPLOY_HOOK`

Each secret should contain the matching Render deploy hook URL for:

- `mailpilot-api`
- `mailpilot-worker`
- `mailpilot-web`

### How CD works

1. Push to `main`
2. GitHub Actions runs `CI`
3. If CI passes, `Deploy to Render` triggers all three Render services

You can also run the deploy workflow manually from the GitHub Actions tab using `workflow_dispatch`.

## Queue and Scheduling Flow

1. Campaign is created as:
- `processing` -> immediately queued
- `scheduled` with past/now `scheduleAt` -> immediately queued
- `scheduled` with future `scheduleAt` -> picked by scheduler
- `draft` -> saved only

2. Scheduler (`node-cron`) runs every minute and queues due scheduled campaigns.

3. Worker consumes `campaign-emails` jobs from Redis:
- Renders variables in subject/body
- Sends via SMTP (Nodemailer)
- Updates per-recipient `EmailLog`
- Updates campaign status and analytics (`analytics.totalSent`)

4. Retries use BullMQ exponential backoff with env-configurable attempts and delay.

## CSV Upload Schema

Bulk upload endpoint expects required headers:

```csv
name,email,company,role
Rahul,rahul@example.com,Google,Software Intern
Priya,priya@example.com,Microsoft,Frontend Engineer
```

Notes:
- File size limit: 2 MB
- `name` and valid `email` are required per row
- Missing required headers will fail the request

## API Summary

Base URL: `/api`

### Health
- `GET /health`

### Auth
- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/google`

### Campaigns (auth required)
- `GET /campaigns`
- `POST /campaigns`
- `POST /campaigns/generate-template`
- `POST /campaigns/bulk` (multipart form-data + CSV file)
- `GET /campaigns/stats`
- `GET /campaigns/logs?status=queued|sent|failed&search=<term>`
- `GET /campaigns/analytics`

### Contacts (auth required)
- `GET /contacts?search=<term>&status=all|active|blocked&tag=<tag>`
- `POST /contacts`
- `PUT /contacts/:contactId`
- `DELETE /contacts/:contactId`

### Templates (auth required)
- `GET /templates?search=<term>&source=all|manual|ai`
- `POST /templates`
- `PUT /templates/:templateId`
- `DELETE /templates/:templateId`
- `PATCH /templates/:templateId/use`

## Personalization Variables

Available template placeholders:

- `{{name}}`
- `{{firstName}}`
- `{{email}}`
- `{{company}}`
- `{{role}}`

These are rendered in the worker before each email is sent.

## Deployment (Render Blueprint)

`render.yaml` provisions:
- `mailpilot-api` (Node web service)
- `mailpilot-worker` (background worker)
- `mailpilot-web` (static frontend)

### Deploy Steps

1. Push this repo to GitHub.
2. In Render, create a new Blueprint and connect the repo.
3. Set secret env vars for API + worker:
- `MONGO_URI`
- `JWT_SECRET`
- `REDIS_URL`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
- `OPENAI_API_KEY`
- `CLIENT_URL` (frontend origin)
- `GOOGLE_CLIENT_ID` (if using Google sign-in)
4. Set static frontend env vars:
- `VITE_API_BASE_URL=https://<your-api-service>.onrender.com/api`
- `VITE_GOOGLE_CLIENT_ID=<google-oauth-client-id>`
5. Verify API health endpoint.

## Security Notes

- Never commit real `.env` secrets.
- Rotate any credentials that were ever committed or shared (MongoDB, Redis, SMTP, OpenAI, JWT secret, Google OAuth).
- Use a strong random `JWT_SECRET` in production.
- Restrict `CLIENT_URL` to trusted frontend origins.

## Current Gaps / Recommendations

- No automated tests are currently configured.
- Add linting, unit tests, and integration tests before production use.
- Add rate limiting and request validation hardening on auth and campaign endpoints.
- Add observability (structured logs + alerting) for worker failures.

## License

No license file is currently included in this repository.
Add a `LICENSE` file if you plan to open-source or distribute the project.
