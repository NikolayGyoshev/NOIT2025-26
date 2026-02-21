# Quick Start Guide

## Prerequisites
- Node.js 20+ installed
- npm or yarn package manager

## Installation

```bash
cd Backend-Builder
npm install
```

## Running in Development

### Option 1: Using npm script (easiest)
```bash
# Set environment first in your terminal/shell
# On Windows PowerShell:
$env:NODE_ENV = 'development'
$env:DATABASE_URL = 'postgres://localhost:5432/test'
$env:SESSION_SECRET = 'dev_secret'

# Run the dev server
npm run dev
```

### Option 2: Direct tsx
```bash
npx tsx server/index.ts
```

The server will start on `http://localhost:5000`

## Features Available in Development

✅ **Client-side**:
- React application fully functional
- All UI components working
- Navigation and routing working
- Room browsing and filtering

✅ **Server-side**:
- Express API endpoints available
- Development authentication (mock users)
- Vite hot module reloading for client

❌ **Requires Database** (PostgreSQL):
- Data persistence
- Room management
- Reservations
- Reviews

## Production Build

```bash
npm run build
npm start
```

The build creates:
- `dist/public/` - Static client files
- `dist/index.cjs` - Bundled server

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| NODE_ENV | No | development | Environment mode |
| DATABASE_URL | For DB features | - | PostgreSQL connection string |
| SESSION_SECRET | No | - | Session encryption secret |
| REPL_ID | For real auth | - | Replit OIDC integration ID |
| PORT | No | 5000 | Server port |

## Type Checking

Verify all TypeScript types are correct:
```bash
npm run check
```

## Architecture

```
Backend-Builder/
├── client/          # React frontend
│   └── src/
│       ├── pages/   # Page components
│       ├── components/ # Reusable UI components
│       └── hooks/   # Custom React hooks
├── server/          # Express backend
│   ├── index.ts     # Server entry point
│   ├── routes.ts    # API routes
│   └── replit_integrations/auth/ # Authentication
└── shared/          # Shared types and schemas
    ├── schema.ts    # Database schemas
    └── routes.ts    # API definitions
```

## Troubleshooting

### Port already in use
```bash
# Change the port
$env:PORT = 3000
npm run dev
```

### Database connection errors (optional)
These are normal in development - the app still runs without a database

### TypeScript errors
```bash
npm run check
```
to see all type errors and fix them

## Next Steps

1. Start the development server
2. Open http://localhost:5000 in your browser
3. Browse the rooms (mock data will load when database is available)
4. Explore the admin panel at /admin
5. Check the API endpoints in `server/routes.ts`
