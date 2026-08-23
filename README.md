# Project Management Portal (PMP) — Phase 1

A scalable, production-grade enterprise Project Management Portal (PMP) built with modern SaaS architecture, decoupled Next.js frontend, NestJS modular monolith backend, and PostgreSQL with Prisma ORM.

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js `v20+` or `v24+`
- PostgreSQL 16 (or run `brew services start postgresql@16` / Docker)

### 2. Setup & Database Seeding

```bash
# Backend Setup
cd backend
npm install
npm run prisma:push
npm run prisma:seed

# Frontend Setup
cd ../frontend
npm install
```

### 3. Run Applications

```bash
# Terminal 1 - Backend (port 4000)
cd backend && npm run start:dev

# Terminal 2 - Frontend (port 3000)
cd frontend && npm run dev
```

- **Frontend App**: [http://localhost:3000](http://localhost:3000)
- **API Base URL**: [http://localhost:4000/api/v1](http://localhost:4000/api/v1)
- **Swagger Documentation**: [http://localhost:4000/api/docs](http://localhost:4000/api/docs)
- **Health Check**: [http://localhost:4000/api/v1/health](http://localhost:4000/api/v1/health)

---

## 🔐 Default Seed Credentials

| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@pmp.local` | `SuperAdmin123!` | Full Wildcard System Access (`*`) |
| **Admin** | `admin.user@pmp.local` | `Admin123!` | Operational Administration |
| **Developer (User)** | `john.doe@pmp.local` | `User123!` | Scoped to Assigned Projects |
| **Designer (User)** | `elena.rostova@pmp.local` | `User123!` | Scoped to Assigned Projects |

---

## 🧪 Testing

```bash
# Run backend E2E & auth tests
cd backend && npm run test:e2e

# Run frontend build verification
cd ../frontend && npm run build
```

---

## 📦 Phase 1 Delivered Features

- [x] **Authentication & Security**: Access token (JWT), single-use refresh token rotation stored hashed in database, password hashing via bcrypt, change password, profile endpoint.
- [x] **Authorization & Permissions**: Granular resource permissions (`@RequirePermissions('projects.create')`) backed by dynamic database mapping.
- [x] **User Management**: Search, filter, role assignment, department link, lifecycle status (`ACTIVE`, `INACTIVE`, `SUSPENDED`, `ARCHIVED`), soft-delete.
- [x] **Department Management**: Organizational structure with live employee and team counts.
- [x] **Team & Squad Management**: Squad roster, team lead assignment, member roles (`LEAD`, `MEMBER`, `CONTRIBUTOR`).
- [x] **Client Management**: Client accounts, contact directory, and active project counts.
- [x] **Project Management**: Project codes, status (`PLANNING`, `ACTIVE`, `ON_HOLD`, `COMPLETED`, `CANCELLED`), health states (`HEALTHY`, `AT_RISK`, `CRITICAL`), client linking, manager assignment, member scoping.
- [x] **Audit & Activity Logs**: Structured activity logging across all key domain operations.
- [x] **Role-Aware Dashboards**: Super Admin, Admin, and User specialized views.
- [x] **Modern Light SaaS UI**: Responsive sidebar, breadcrumbs, search, data tables, modals, toast feedback.
