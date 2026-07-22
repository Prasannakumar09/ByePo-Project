# Multi-Tenant Feature Flag Management System

A small SaaS-style feature-flag management system built for the Byepo Technologies technical assignment. The system lets a Super Admin create organizations (tenants), lets each organization's admin manage their own feature flags, and lets end users check whether a given feature is enabled for their organization.

---

## Overview

The system has three roles and three separate frontend applications, all backed by one Node.js/Express API:

| Role | App | What they do |
|---|---|---|
| **Super Admin** | Super Admin App | Logs in with static credentials, creates organizations, views the list of all organizations |
| **Organization Admin** | Admin App | Signs up (joins an existing org), logs in, creates/toggles/deletes feature flags scoped to their own organization |
| **End User** | User App | No login — picks an organization and a feature key, submits, and sees whether that feature is enabled |

---

## Tech Stack

- **Backend:** Node.js, Express
- **Database:** MongoDB (Mongoose)
- **Auth:** Custom implementation — bcrypt for password hashing, JWT for session tokens (no third-party auth providers, per assignment constraints)
- **Frontend:** Angular 19 (NgModule-based, not standalone components), Bootstrap 5 + ng-bootstrap
- **Three independent Angular apps** in a single CLI workspace, each with its own routing, guard, and interceptor

---

## Architecture & Key Decisions

### Why three separate frontend apps instead of one app with role-based routing
The assignment explicitly calls for three separate front-end applications, each with its own required-feature list. This mirrors a common real-world pattern where an internal ops tool, a customer-facing admin portal, and a public-facing widget are genuinely separate deployables with different security postures and release cycles. A single app with `*ngIf`-based role switching would be the simpler, more collapsed version of this — the assignment is testing whether role boundaries can be kept clean at the architecture level, not just with a conditional.

### Organization creation vs. Org Admin signup — two distinct steps
The Super Admin creates the **organization record** (just a name — an empty tenant container). The Organization Admin's **signup** creates a **user account** attached to an already-existing organization. This split avoids the Super Admin having to set another person's password, and allows more than one admin to eventually join the same org.

### How the End User identifies their organization
The assignment's required features for the End User app list only a feature-key input and submit button, with no login step. Since an org must still be identified, the End User app includes an **organization dropdown** (populated from a public, non-sensitive `GET /api/organizations/public` endpoint) alongside the feature-key input. This mirrors how real feature-flag SDKs perform client-side evaluation keyed by an environment/org identifier rather than a login. This is a deliberate assumption made to resolve an ambiguity in the spec.

### Tenant isolation
Every organization-admin-scoped endpoint (`/api/flags/*`) derives the organization ID from the **decoded JWT**, never from the request body or URL params. An org admin cannot access or modify another organization's flags even by guessing a valid flag ID — this was manually tested with two separate organizations and two separate admin accounts.

### Duplicate feature keys
`(orgId, key)` has a compound unique index at the MongoDB schema level, so duplicate flag keys within the same organization are rejected at the database layer, not just in application code.

### Organization edit/delete (extension beyond the base spec)
The base assignment only requires the Super Admin to create and list organizations. This implementation additionally supports editing an organization's name and deleting an organization, since real admin tooling generally needs both. Deleting an organization cascades to remove that organization's users and feature flags, rather than leaving orphaned records pointing at a nonexistent `orgId`.

---

## Data Model

**Organization**
- `name` (unique, required)
- `createdAt`

**User**
- `email` (unique, required)
- `passwordHash`
- `role` (`super_admin` | `org_admin`)
- `orgId` (null for super admin)

**FeatureFlag**
- `orgId` (ref → Organization, required)
- `key` (required)
- `enabled` (boolean, default false)
- `createdAt`, `updatedAt`
- Compound unique index on `(orgId, key)`

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/super-admin/login` | — | Super admin login (static credentials) |
| POST | `/api/auth/org-admin/signup` | — | Org admin signup, requires existing `orgId` |
| POST | `/api/auth/org-admin/login` | — | Org admin login |
| GET | `/api/organizations/public` | — | Returns `{_id, name}` list — powers signup & end-user dropdowns |
| POST | `/api/organizations` | Super Admin | Create an organization |
| GET | `/api/organizations` | Super Admin | List all organizations |
| PUT | `/api/organizations/:id` | Super Admin | Update an organization's name |
| DELETE | `/api/organizations/:id` | Super Admin | Delete an organization |
| GET | `/api/flags` | Org Admin | List flags for the logged-in admin's org |
| POST | `/api/flags` | Org Admin | Create a feature flag |
| PATCH | `/api/flags/:id` | Org Admin | Toggle/update a flag |
| DELETE | `/api/flags/:id` | Org Admin | Delete a flag |
| POST | `/api/check` | — | `{orgId, key}` → `{enabled}` — public flag lookup |

---

## Project Structure

```
backend/
  config/db.js
  models/            organization.model.js, user.model.js, featureFlag.model.js
  controllers/        auth.controller.js, org.controller.js, flag.controller.js
  services/           (business logic layer, called by controllers)
  middleware/         verifyToken.js, requireRole.js, errorHandler.js
  routes/             auth.routes.js, org.routes.js, flag.routes.js
  utils/asyncHandler.js
  server.js
  .env / .env.example

Multi-Tenant-Spr-Frontend/    Super Admin App — login, org list, add/edit/delete org
Multi-Tenant-Org-Frontend/    Admin App — signup, login, flag dashboard
Multi-Tenant-Usr-Frontend/    User App — org dropdown + feature-key check (no auth)
```

Each frontend is a fully independent Angular CLI project (own `package.json`, own `node_modules`), rather than three apps inside a single workspace — a valid alternative reading of the assignment's "three separate front-end applications" requirement, and arguably a stronger demonstration of genuine deployable separation.

---

## Setup & Running Locally

### Prerequisites
- Node.js (v18+)
- MongoDB running locally, or a MongoDB Atlas connection string
- Angular CLI (`npm install -g @angular/cli`)

### 1. Backend

```bash
cd backend
npm install
```

Create a `.env` file in `backend/` (see `.env.example`):

```dotenv
MONGO_URI=mongodb://localhost:27017/byepo
JWT_SECRET=your-secret-here
PORT=3233
SUPER_ADMIN_EMAIL=admin@byepo.com
SUPER_ADMIN_PASSWORD=changeme
```

Start the server:

```bash
node server.js
```

The API runs at `http://localhost:3233`. Confirm it's up via `http://localhost:3233/health`.

### 2. Frontend — three independent Angular projects

Each app is a separate Angular project with its own `node_modules`, so install and run each one individually. All three point at the same backend (`http://localhost:3233/api`, configured in each app's `src/environments/environment.ts`).

**Super Admin App**
```bash
cd Multi-Tenant-Spr-Frontend
npm install
ng serve --port 4200
```
→ http://localhost:4200 — log in with the `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` from your `.env`.

**Admin App**
```bash
cd Multi-Tenant-Org-Frontend
npm install
ng serve --port 4201
```
→ http://localhost:4201 — sign up, selecting an organization created via the Super Admin app.

**User App**
```bash
cd Multi-Tenant-Usr-Frontend
npm install
ng serve --port 4202
```
→ http://localhost:4202 — no login required. Select an org and a feature key to check its status.

### Suggested test flow
1. Start the backend.
2. Log into the Super Admin app → create an organization (e.g. "Acme Corp").
3. Open the Admin app → sign up as that org's admin → log in → create a feature flag (e.g. `dark_mode`) → toggle it on.
4. Open the User app → select "Acme Corp" → enter `dark_mode` → confirm it returns **enabled**.

---

## Self-Grade

**Performance:** Reasonable for the project's scale — MongoDB queries are indexed on the fields actually filtered/sorted on (`(orgId, key)` compound index for flags), and there are no N+1 query patterns. No caching or pagination was added, since the assignment's scope doesn't call for it.

**Readability & Maintainability:** Backend is split into models/controllers/services/routes/middleware rather than one large file per resource. Frontend logic lives in Angular services rather than components, keeping components focused on binding. Naming is consistent across the codebase.

**Stability:** Centralized error handling middleware converts Mongoose/JWT errors into correct HTTP status codes (400/401/403/404/409/500). Tenant isolation was manually verified across two organizations. Edge cases explicitly handled: duplicate flag keys, signup against a nonexistent org, invalid/expired tokens, malformed request bodies. Not covered: rate limiting, concurrent-update conflict handling on flags.

**Testability:** Backend logic sits in a services layer separated from Express route handlers, making it callable without spinning up the server. [Add a note here on whether you wrote actual Jest/Supertest tests, and if so, how to run them, e.g. `npm test`.]

---

## Known Limitations / What I'd Do With More Time

- No automated test suite currently included (or: brief note on what coverage exists)
- JWTs are stored in `localStorage` rather than httpOnly cookies — a reasonable trade-off for this scope, but not the production-grade choice
- No rate limiting on auth endpoints
- No pagination on organization/flag lists (fine at current expected scale)
- CORS is open for local development rather than locked to specific origins
