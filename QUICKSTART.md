# Quick Start (Local Development)

## 1) Prerequisites
- Node.js 20+
- npm

## 2) Install dependencies

```powershell
cd NOIT2025-26-main
npm install
```

## 3) Create local environment file

Create `.env` in the project root with values like this:

```env
NODE_ENV=development
SESSION_SECRET=dev_secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Admin12345
ADMIN_FIRST_NAME=Admin
ADMIN_LAST_NAME=User
DEMO_EMAIL=nikolaygyoshev3@gmail.com
DEMO_PASSWORD=NOIT2025/2026
```

> `DATABASE_URL` is optional for local start. Without it, the app uses in-memory storage.

## 4) Run in development

```powershell
npm run dev
```

Default URL:
- http://localhost:5000

If port 5000 is busy:

```powershell
$env:PORT='5055'
npm run dev
```

## 5) Login accounts

### Administrator
- Email: `admin@example.com`
- Password: `Admin12345`

### Registered user
- Email: `nikolaygyoshev3@gmail.com`
- Password: `NOIT2025/2026`

In `development`, this demo user is auto-created on server start (can be overridden with `DEMO_EMAIL`/`DEMO_PASSWORD`).

## 6) Useful routes
- Home: `/`
- Login: `/login`
- Admin panel: `/admin`

## 7) Optional commands

Type check:

```powershell
npm run check
```

Production build:

```powershell
npm run build
npm start
```

## 8) Deploy to Fly.io (quick)

If you already have an existing Fly app, using the same app name keeps the same URL.

```powershell
# Install Fly CLI if needed
# https://fly.io/docs/hands-on/install-flyctl/

# Login
fly auth login

# In project root
fly launch --no-deploy

# Set required secrets
fly secrets set SESSION_SECRET=your_secret
fly secrets set ADMIN_EMAIL=admin@example.com
fly secrets set ADMIN_PASSWORD=Admin12345

# Optional (if using PostgreSQL)
fly secrets set DATABASE_URL=postgres://...

# Deploy
fly deploy
```

Useful checks:

```powershell
fly status
fly logs
```

## Troubleshooting

### `EADDRINUSE` (port already in use)
Run with a different port:

```powershell
$env:PORT='5055'
npm run dev
```

### Admin panel not visible
- Log in with the same email as `ADMIN_EMAIL` from `.env`.
- Restart server after changing `.env`.

### No data persistence
If `DATABASE_URL` is not set, data is stored in memory and resets on restart.
