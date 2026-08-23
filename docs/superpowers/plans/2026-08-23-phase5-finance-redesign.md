# Phase 5 Finance Module Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign and simplify the PMP Phase 5 Financial Module into a production-ready, project-level money tracker (Project Value, Client Payments, Remaining Balance, Project Expenses, Current Cash Position, Expected Project Profit, Team Member Payments) restricted strictly to Super Admin.

**Architecture:** 
Clean backend domain entities (`ProjectFinancial`, `ClientPayment`, `ProjectExpense`, `FinancialAuditLog`) managed through dedicated services with strict overpayment guards and audit logging, exposed via NestJS controllers locked to `SUPER_ADMIN`, paired with a light, modern React/Next.js frontend featuring global dashboard metrics, project-level finance sub-tabs, and team member payment views.

**Tech Stack:** NestJS 11, Prisma 6 ORM, PostgreSQL, Next.js 14, Tailwind CSS, TypeScript, Supertest / Jest.

**Spec:** `docs/superpowers/specs/2026-08-23-phase5-finance-redesign-design.md`

## Global Constraints
- Access is strictly restricted to `SUPER_ADMIN` (both in UI and backend with 403 Forbidden for `ADMIN` and `USER`).
- All money values must be represented safely as positive non-zero integers.
- Overpayments are strictly disallowed: total payments received cannot exceed project value.
- Every financial mutation (create, edit, delete) must record a structured `FinancialAuditLog` entry.
- No regression in Projects, Milestones, Tasks, Timesheets, Risks, Issues, or RBAC modules.

---

### Task 1: Schema Refactor & Prisma Migration & Seeding

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Modify: `backend/prisma/seed.ts`
- Modify: `backend/prisma/clean-seed.ts`

- [ ] **Step 1: Update Prisma schema with new models and enums**
Replace legacy invoice models with `ProjectFinancial`, `ClientPayment`, `ProjectExpense`, `FinancialAuditLog`, `ExpenseCategory`, and `PaymentMethod`. Remove references to `Invoice`, `InvoiceLineItem`, `MilestonePaymentPlan`, `PaymentTransaction` from `User`, `Project`, `Milestone`, `Client`.

- [ ] **Step 2: Apply schema changes and generate Prisma Client**
Run `npx prisma db push` and `npx prisma generate` in `backend`.

- [ ] **Step 3: Update permissions and roles in `seed.ts` and `clean-seed.ts`**
Ensure `finance.read`, `finance.manage`, and `finance.export` are assigned exclusively to `SUPER_ADMIN`. Ensure `adminPermissions` and `userPermissions` explicitly exclude all finance permissions.

- [ ] **Step 4: Run database seed**
Execute `npm run prisma:seed` in `backend` to verify seeding completes without errors.

---

### Task 2: Backend Finance DTOs & Validation

**Files:**
- Create: `backend/src/modules/finance/dto/project-financial.dto.ts`
- Create: `backend/src/modules/finance/dto/client-payment.dto.ts`
- Create: `backend/src/modules/finance/dto/project-expense.dto.ts`
- Create: `backend/src/modules/finance/dto/finance-query.dto.ts`
- Delete: `backend/src/modules/finance/dto/invoice.dto.ts`
- Delete: `backend/src/modules/finance/dto/milestone-payment-plan.dto.ts`
- Delete: `backend/src/modules/finance/dto/payment-transaction.dto.ts`

- [ ] **Step 1: Create DTOs with class-validator decorators**
Define `SetProjectFinancialDto`, `CreateClientPaymentDto`, `UpdateClientPaymentDto`, `CreateProjectExpenseDto`, `UpdateProjectExpenseDto`, `ExpenseQueryDto`, and `FinanceDashboardQueryDto`.

---

### Task 3: Backend Finance Services Implementation

**Files:**
- Create: `backend/src/modules/finance/services/project-financials.service.ts`
- Create: `backend/src/modules/finance/services/client-payments.service.ts`
- Create: `backend/src/modules/finance/services/project-expenses.service.ts`
- Create/Modify: `backend/src/modules/finance/services/finance-dashboard.service.ts`
- Delete obsolete services: `backend/src/modules/finance/services/invoices.service.ts`, `backend/src/modules/finance/services/milestone-payments.service.ts`, `backend/src/modules/finance/services/payment-transactions.service.ts`, `backend/src/modules/finance/services/financial-settings.service.ts`

- [ ] **Step 1: Implement `ProjectFinancialsService`**
Calculate project-level metrics:
- Project Value
- Total Received
- Remaining Amount ($\max(0, \text{Value} - \text{Received})$)
- Total Expenses
- Current Cash Position ($\text{Received} - \text{Expenses}$)
- Expected Project Profit ($\text{Value} - \text{Expenses}$)
Add guard preventing `projectValue` from being set lower than existing `Total Received`. Log audit entries.

- [ ] **Step 2: Implement `ClientPaymentsService`**
Implement `createPayment`, `updatePayment`, `deletePayment`, `getProjectPayments`.
Enforce overpayment validation: $(\text{Existing Received} + \text{New Amount}) \le \text{Project Value}$.
Audit log on create, edit, delete.

- [ ] **Step 3: Implement `ProjectExpensesService`**
Implement `createExpense`, `updateExpense`, `deleteExpense`, `getProjectExpenses` with category and user filtering.
Audit log on create, edit, delete.

- [ ] **Step 4: Implement `FinanceDashboardService`**
Aggregate global metrics across all projects, generate project overview list with financial metrics, team member payment summaries, and audit trail retrieval.

---

### Task 4: Backend Controllers, Module Wiring & Strict RBAC

**Files:**
- Create: `backend/src/modules/finance/controllers/project-financials.controller.ts`
- Create: `backend/src/modules/finance/controllers/client-payments.controller.ts`
- Create: `backend/src/modules/finance/controllers/project-expenses.controller.ts`
- Modify: `backend/src/modules/finance/controllers/finance.controller.ts`
- Modify: `backend/src/modules/finance/finance.module.ts`
- Delete obsolete controllers: `backend/src/modules/finance/controllers/invoices.controller.ts`, `backend/src/modules/finance/controllers/milestone-payments.controller.ts`, `backend/src/modules/finance/controllers/payments.controller.ts`, `backend/src/modules/finance/controllers/financial-settings.controller.ts`

- [ ] **Step 1: Implement controllers with `@RequirePermissions('finance.read' | 'finance.manage')` and Super Admin checks**
- [ ] **Step 2: Update `FinanceModule` to export and declare all new controllers and services**
- [ ] **Step 3: Build backend (`npm run build`) to verify clean compilation without any dangling references**

---

### Task 5: Frontend Types & API Client Alignment

**Files:**
- Modify: `frontend/src/types/index.ts`

- [ ] **Step 1: Replace legacy invoice types in `frontend/src/types/index.ts` with new finance types**
Add `ExpenseCategory`, `PaymentMethod`, `ProjectFinancial`, `ClientPayment`, `ProjectExpense`, `FinancialSummaryMetrics`, `ProjectFinancialSummary`, `TeamMemberPaymentSummary`, `FinancialAuditLog`.

---

### Task 6: Frontend Project Finance Tab & Sub-components

**Files:**
- Create/Modify: `frontend/src/features/finance/project-financials/ProjectFinancialsTab.tsx`
- Create: `frontend/src/features/finance/project-financials/EditProjectValueModal.tsx`
- Create: `frontend/src/features/finance/project-financials/AddEditClientPaymentModal.tsx`
- Create: `frontend/src/features/finance/project-financials/AddEditProjectExpenseModal.tsx`
- Modify: `frontend/src/app/(dashboard)/projects/[id]/page.tsx`

- [ ] **Step 1: Build the 6 Financial Summary Cards with Tooltip Explanations**
- [ ] **Step 2: Build the Sub-tabs (Overview, Client Payments, Expenses)**
- [ ] **Step 3: Build Add/Edit Client Payment Modal with overpayment validation**
- [ ] **Step 4: Build Add/Edit Project Expense Modal with team member selector**
- [ ] **Step 5: Wire into `projects/[id]/page.tsx` strictly visible when `isSuperAdmin`**

---

### Task 7: Frontend Global Finance Dashboard & Team Member Payments View

**Files:**
- Modify: `frontend/src/features/finance/dashboard/FinanceDashboardView.tsx`
- Modify: `frontend/src/app/(dashboard)/finance/page.tsx`
- Create: `frontend/src/features/finance/team-members/TeamMemberPaymentsView.tsx`
- Create: `frontend/src/app/(dashboard)/finance/team-members/page.tsx`
- Remove obsolete pages: `frontend/src/app/(dashboard)/finance/invoices`, `frontend/src/app/(dashboard)/finance/payments`, `frontend/src/app/(dashboard)/finance/milestone-payments`, `frontend/src/app/(dashboard)/finance/reports`
- Modify: `frontend/src/components/layout/sidebar.tsx`
- Update: `frontend/src/features/finance/index.ts`

- [ ] **Step 1: Update Global Finance Dashboard with cards and project financial overview table**
- [ ] **Step 2: Build Team Member Payments page (`/finance/team-members`)**
- [ ] **Step 3: Update sidebar navigation to show Finance only to Super Admin**
- [ ] **Step 4: Remove obsolete invoice pages and build frontend (`npm run build` or typecheck)**

---

### Task 8: End-to-End Tests & Verification

**Files:**
- Modify/Rewrite: `backend/test/phase5.e2e-spec.ts`

- [ ] **Step 1: Write comprehensive Phase 5 E2E test suite covering:**
  - Setting and updating Project Value
  - Recording single and multiple client payments
  - Verifying remaining amount calculations
  - Overpayment rejection guard ($>\text{Project Value}$)
  - Editing and deleting client payments
  - Recording and filtering project expenses (team member vs other)
  - Accurate cash position and expected profit calculation
  - Team member payment aggregation endpoint
  - Super Admin full access vs Admin 403 Forbidden vs User 403 Forbidden
  - Audit logging verification
- [ ] **Step 2: Run `npm run test:e2e` in `backend` and ensure all tests pass**

---

### Task 9: Documentation Updates

**Files:**
- Modify: `docs/PMP_USER_GUIDE.md`
- Modify: `docs/PMP_PRODUCTION_READINESS.md`

- [ ] **Step 1: Replace old invoice/billing chapter with Project Finance Chapter in `PMP_USER_GUIDE.md`**
- [ ] **Step 2: Update Phase 5 section in `PMP_PRODUCTION_READINESS.md`**
