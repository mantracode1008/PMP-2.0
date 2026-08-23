# PMP Architecture & Domain Specification (Phase 1)

## 1. System Topology
The Project Management Portal (PMP) is architected as a clean, decoupled monorepo consisting of:
- **Backend**: NestJS 11 Modular Monolith on Node.js 24 with PostgreSQL 16 & Prisma ORM.
- **Frontend**: Next.js 15 App Router with Tailwind CSS, Lucide icons, and TanStack Query.
- **Security**: JWT Access Tokens (15 min) + Hashed DB Refresh Tokens with single-use rotation (7 days) + Role-derived resource permissions (`@RequirePermissions('module.action')`).

## 2. Core Entities & Schema
- `User`: Identity, department association, hashed password, soft-delete.
- `Role`: System and custom roles (`SUPER_ADMIN`, `ADMIN`, `USER`).
- `Permission`: Fine-grained token codes (`users.create`, `projects.update`, etc.).
- `RolePermission`: Many-to-many relationship mapping permissions to roles.
- `Department`: Organizational business units.
- `Team` & `TeamMember`: Squads and member assignments (`LEAD`, `MEMBER`, `CONTRIBUTOR`).
- `Client`: External account directory.
- `Project` & `ProjectMember`: Project lifecycle (`DRAFT`, `PLANNING`, `ACTIVE`, `ON_HOLD`, `COMPLETED`, `CANCELLED`, `ARCHIVED`), health states (`HEALTHY`, `AT_RISK`, `CRITICAL`), and scoped member access.
- `ActivityLog`: Centralized audit trail.
