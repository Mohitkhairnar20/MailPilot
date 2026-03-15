# MailPilot - AI Email Automation Platform

MailPilot is a starter full-stack email automation platform built with React, Vite, Tailwind CSS, Express, MongoDB, Redis, BullMQ, Nodemailer, and JWT authentication.

## Project Structure

```text
MailPilot/
|-- backend/
|   |-- package.json
|   |-- .env.example
|   `-- src/
|-- frontend/
|   |-- package.json
|   |-- .env.example
|   `-- src/
|-- package.json
`-- README.md
```

## Setup

1. Install dependencies:

```bash
npm run install:all
```

2. Copy env files:

```bash
copy backend\\.env.example backend\\.env
copy frontend\\.env.example frontend\\.env
```

3. Start MongoDB and Redis locally.
4. Run the backend and frontend together:

```bash
npm run dev
```

Frontend runs on `http://localhost:5173` and backend on `http://localhost:5000`.

## Deploy on Render

This repo includes a Render Blueprint file: `render.yaml`.

1. Push this project to GitHub.
2. In Render, click **New +** -> **Blueprint** and connect the repo.
3. Render will create:
   - `mailpilot-api` (Node web service)
   - `mailpilot-worker` (background worker)
   - `mailpilot-web` (static frontend)
4. Set required secret env vars in Render for API + worker:
   - `MONGO_URI`, `JWT_SECRET`, `REDIS_URL`
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
   - `OPENAI_API_KEY`
   - `GOOGLE_CLIENT_ID` (if using Google auth)
5. Set frontend env vars in Render static site:
   - `VITE_API_BASE_URL` = `https://<your-api-service>.onrender.com/api`
   - `VITE_GOOGLE_CLIENT_ID`
6. Set backend `CLIENT_URL` to your frontend URL (`https://<your-frontend-service>.onrender.com`).

Health endpoint: `GET /api/health`

## Security Note

Do not commit real secrets in `.env` files. Keep secrets only in Render environment variables.
If secrets were shared previously, rotate them before production deployment.
