# Agentic Umbrella Platform

A production-grade contractor payroll management system connecting Agencies, Umbrella Companies, and Contractors.

## Tech Stack
- **Runtime**: Node.js (ESM)
- **Framework**: Express
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Auth**: JWT (Phase 2)

## Project Structure

```
agentic-umbrella/
├── prisma/
│   └── schema.prisma          # All DB models and enums
├── src/
│   ├── config/
│   │   ├── env.js             # Validated environment variables
│   │   └── prisma.js          # Prisma client singleton
│   ├── controllers/           # Request handlers (Phase 2+)
│   ├── middlewares/
│   │   └── errorHandler.js    # Global error handler + asyncHandler
│   ├── routes/
│   │   └── health.routes.js   # Health check endpoint
│   ├── services/              # Business logic (Phase 2+)
│   ├── utils/
│   │   └── response.js        # sendSuccess / sendError helpers
│   ├── app.js                 # Express app config
│   └── server.js              # Entry point + graceful shutdown
├── .env.example
├── nodemon.json
└── package.json
```

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment
```bash
cp .env.example .env
# Edit .env with your Postgres credentials
```

### 3. Run database migrations
```bash
npm run db:migrate
# Enter migration name when prompted, e.g. "init"
```

### 4. Generate Prisma client
```bash
npm run db:generate
```

### 5. Start development server
```bash
npm run dev
```

### 6. Verify health check
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "status": "healthy",
    "database": "connected",
    "timestamp": "...",
    "uptime": "3s"
  }
}
```

## Core Architecture Decisions

| Decision | Rationale |
|---|---|
| ESM (`"type": "module"`) | Modern JS, cleaner imports |
| Prisma singleton | Avoids connection pool exhaustion |
| `asyncHandler` wrapper | Eliminates try/catch in every controller |
| Structured `sendSuccess`/`sendError` | Consistent API shape across all endpoints |
| Graceful shutdown | Closes DB connections before exit |
| Zod (coming Phase 2) | Runtime validation at the route boundary |

## Phase Roadmap

- [x] **Phase 1** — Project setup, Prisma schema, Express foundation
- [ ] **Phase 2** — Identity, RBAC, JWT auth, multi-tenancy
- [ ] **Phase 3** — Timesheets, versioning, approval workflow
- [ ] **Phase 4** — Invoicing, payment reconciliation
- [ ] **Phase 5** — Payroll engine, gross-to-net, payslips
- [ ] **Phase 6** — Compliance, audit log, notifications

postgresql://neondb_owner:npg_65NyJnaBlFug@ep-sweet-mud-aoesek6w-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require