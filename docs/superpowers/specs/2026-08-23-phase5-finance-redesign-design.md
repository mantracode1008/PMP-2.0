# PMP Phase 5 Finance Module Redesign Specification

## 1. Executive Summary

The existing Phase 5 Financial Module was previously modeled around a traditional commercial billing and invoicing engine (multi-status invoices, line items, milestone tranches, payment plan reconciliation). For PMP's core requirements, this introduced unnecessary complexity.

This specification documents the simplified, production-grade **Project Financial Management** system. The system centers directly on project-level cash flow tracking:
- **Project Financial Value** (Contract Value)
- **Client Payments Received**
- **Remaining Client Balance**
- **Project Expenses** (including Developer / Designer / Freelancer / Team Member project allocations)
- **Current Cash Position** ($\text{Received} - \text{Expenses}$)
- **Expected Project Profit** ($\text{Project Value} - \text{Expenses}$)
- **Team Member Payments Breakdown** (aggregate summary across projects)

Access is strictly restricted to **SUPER ADMIN** on both backend and frontend layers.

---

## 2. Role & Access Control (RBAC)

| Role | Access Level | Permissions |
| :--- | :--- | :--- |
| **Super Admin (`SUPER_ADMIN`)** | Full Access | `finance.read`, `finance.manage`, `finance.export` |
| **Admin (`ADMIN`)** | ⛔ Zero Access (`403 Forbidden`) | No finance permissions. Hidden from UI. |
| **User (`USER`)** | ⛔ Zero Access (`403 Forbidden`) | No finance permissions. Hidden from UI. |

---

## 3. Data Model & Prisma Schema

### Enums

```prisma
enum ExpenseCategory {
  TEAM_MEMBER_PAYMENT
  FREELANCER_PAYMENT
  DESIGNER_PAYMENT
  DEVELOPER_PAYMENT
  SOFTWARE_TOOLS
  INFRASTRUCTURE
  MARKETING
  OTHER
}

enum PaymentMethod {
  UPI
  BANK_TRANSFER
  CREDIT_CARD
  CASH
  CHEQUE
  OTHER
}
```

### Models

```prisma
model ProjectFinancial {
  id           String    @id @default(cuid())
  projectId    String    @unique
  project      Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  currency     String    @default("INR")
  projectValue Int       @default(0) // Monetary value in integer currency units
  
  createdById  String
  createdBy    User      @relation("FinancialSettingsCreator", fields: [createdById], references: [id], onDelete: Restrict)
  
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  deletedAt    DateTime?

  @@index([projectId])
}

model ClientPayment {
  id              String        @id @default(cuid())
  projectId       String
  project         Project       @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  amount          Int           // Positive integer > 0
  paymentDate     DateTime      @default(now())
  paymentMethod   PaymentMethod @default(UPI)
  referenceNumber String?
  notes           String?
  
  createdById     String
  createdBy       User          @relation("ClientPaymentCreator", fields: [createdById], references: [id], onDelete: Restrict)
  
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  deletedAt       DateTime?

  @@index([projectId])
  @@index([paymentDate])
  @@index([deletedAt])
}

model ProjectExpense {
  id              String          @id @default(cuid())
  projectId       String
  project         Project         @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  category        ExpenseCategory @default(OTHER)
  userId          String?         // Optional link to User for team member project payments
  user            User?           @relation("ExpenseRecipient", fields: [userId], references: [id], onDelete: SetNull)
  
  amount          Int             // Positive integer > 0
  paymentDate     DateTime        @default(now())
  paymentMethod   PaymentMethod?
  referenceNumber String?
  description     String
  receiptUrl      String?
  
  createdById     String
  createdBy       User            @relation("ExpenseCreator", fields: [createdById], references: [id], onDelete: Restrict)
  
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  deletedAt       DateTime?

  @@index([projectId])
  @@index([category])
  @@index([userId])
  @@index([paymentDate])
  @@index([deletedAt])
}

model FinancialAuditLog {
  id             String    @id @default(cuid())
  actorId        String
  actor          User      @relation("FinancialAuditActor", fields: [actorId], references: [id], onDelete: Restrict)
  action         String    // SET_PROJECT_VALUE, CREATE_PAYMENT, UPDATE_PAYMENT, DELETE_PAYMENT, CREATE_EXPENSE, UPDATE_EXPENSE, DELETE_EXPENSE
  entityType     String    // PROJECT_FINANCIAL, CLIENT_PAYMENT, PROJECT_EXPENSE
  entityId       String
  projectId      String?
  previousValues Json?
  newValues      Json?
  reason         String?
  createdAt      DateTime  @default(now())

  @@index([actorId])
  @@index([entityType, entityId])
  @@index([projectId])
  @@index([createdAt])
}
```

---

## 4. Financial Calculations & Business Logic

For any project:
1. $\text{Project Value} = \text{Configured value in ProjectFinancial}$
2. $\text{Total Received} = \sum_{p \in \text{Valid Client Payments}} p.\text{amount}$
3. $\text{Remaining Amount} = \max(0, \text{Project Value} - \text{Total Received})$
4. $\text{Total Expenses} = \sum_{e \in \text{Valid Project Expenses}} e.\text{amount}$
5. $\text{Current Cash Position} = \text{Total Received} - \text{Total Expenses}$
6. $\text{Expected Project Profit} = \text{Project Value} - \text{Total Expenses}$

### Validation Invariants:
- Payment and expense amounts must be strictly $> 0$.
- **Overpayment Guard**: If $(\text{Current Total Received} + \text{New Payment Amount}) > \text{Project Value}$, the request is rejected with `BadRequestException` ("Payment amount exceeds remaining project value").
- **Project Value Lower Bound Guard**: When updating `projectValue`, it cannot be set lower than the current `Total Received` amount.
- **Audit Logging**: Every mutation (Create, Update, Delete) emits a structured `FinancialAuditLog` record containing before and after states.

---

## 5. API Endpoints Specification

All endpoints require JWT Authentication and `SUPER_ADMIN` role (or `finance.read`/`finance.manage` permission).

### 5.1 Global Finance APIs
- `GET /api/v1/finance/dashboard`: Global aggregation metrics + project financial summaries table list.
- `GET /api/v1/finance/team-members`: Filtered summary of payments grouped by team member with per-project breakdown.
- `GET /api/v1/finance/audit-logs`: Financial audit trail records.

### 5.2 Project Financial Settings
- `GET /api/v1/projects/:projectId/financials`: Project financial summary, calculated metrics, recent payments, recent expenses.
- `POST /api/v1/projects/:projectId/financials`: Upsert project value and currency.

### 5.3 Client Payments
- `GET /api/v1/projects/:projectId/payments`: List payments for a project.
- `POST /api/v1/projects/:projectId/payments`: Record a client payment with overpayment check.
- `PATCH /api/v1/projects/:projectId/payments/:paymentId`: Update a client payment.
- `DELETE /api/v1/projects/:projectId/payments/:paymentId`: Delete a client payment.

### 5.4 Project Expenses
- `GET /api/v1/projects/:projectId/expenses`: List expenses for a project (with category, user, date query filters).
- `POST /api/v1/projects/:projectId/expenses`: Record a project expense.
- `PATCH /api/v1/projects/:projectId/expenses/:expenseId`: Update a project expense.
- `DELETE /api/v1/projects/:projectId/expenses/:expenseId`: Delete a project expense.

---

## 6. Frontend UI / UX Architecture

### 6.1 Sidebar Navigation
- Super Admin: **Finance**
  - **Overview / Dashboard** (`/finance`)
  - **Team Member Payments** (`/finance/team-members`)
- Admin & User: Finance navigation items are completely removed.

### 6.2 Global Finance Dashboard (`/finance`)
- **Top Summary Cards**:
  1. Total Project Value
  2. Total Received
  3. Total Pending Amount
  4. Total Project Expenses
  5. Current Cash Position
  6. Total Expected Profit
- **Project Financial Overview Table**:
  - Project Name, Client, Value, Received, Pending, Expenses, Cash Position, Expected Profit, Status, Quick View.
  - Search & Status filtering.

### 6.3 Project Detail → Finance Tab (`/projects/:id` tab `financials`)
- **Top Metrics Cards**: 6 Project-level summary cards.
- **Sub-Tabs**:
  1. **Overview Tab**: Financial health breakdown, quick project value editor modal.
  2. **Client Payments Tab**: List of payment entries, "+ Add Payment" modal with auto-fill remaining amount, inline edit/delete.
  3. **Expenses Tab**: List of project expenses, filter by Category and Team Member, "+ Add Expense" modal (with team member selector for team payments), inline edit/delete.

### 6.4 Team Member Payments View (`/finance/team-members`)
- Clean aggregated cards/table showing total project payments received by each team member across all projects, expandable to inspect project breakdowns.

---

## 7. Testing & Verification Plan

1. **Unit & Calculations Testing**:
   - Verify all formulas: Project Value, Total Received, Remaining, Expenses, Cash Position, Expected Profit.
   - Test edge cases: 0 expenses, 100% payments received, zero remaining, negative cash positions.
2. **Security & RBAC Testing**:
   - Super Admin: Full CRUD access.
   - Admin (`ADMIN`): All endpoints return `403 Forbidden`.
   - User (`USER`): All endpoints return `403 Forbidden`.
3. **E2E Integration Test Suite**:
   - Update `backend/test/phase5.e2e-spec.ts` with comprehensive end-to-end scenarios covering multi-project finances, overpayment rejection, team member payments, and audit logs.
   - Run `backend/test/master-audit.e2e-spec.ts` to guarantee zero regressions.
4. **Documentation**:
   - Update `docs/PMP_USER_GUIDE.md` and `docs/PMP_PRODUCTION_READINESS.md`.
