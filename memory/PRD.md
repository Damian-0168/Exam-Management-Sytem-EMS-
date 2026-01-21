# SEAMS - School Examination & Academic Management System

## Original Problem Statement
Build a School Examination & Academic Management System with:
- Role-Based Access Control (RBAC) for Admin and Teacher roles
- Secure PDF uploads with signed URLs and watermarking
- Audit logging for critical user actions
- Multi-school support with school codes

## Tech Stack
- **Frontend**: React, TypeScript, Vite, TailwindCSS, Shadcn/UI
- **Backend**: FastAPI (Python)
- **Database**: PostgreSQL via Supabase
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage

## Architecture
```
/app/
├── backend/         # FastAPI backend
│   ├── routes/      # API routers (audit, storage, permissions, config)
│   ├── models/      # Pydantic models
│   └── server.py    # Main FastAPI app
├── frontend/        # React/Vite frontend
│   ├── src/
│   │   ├── components/Auth/  # AdminSetup, TeacherAuth, SchoolSelector
│   │   ├── hooks/            # useTeacherAuth
│   │   └── integrations/     # Supabase client
│   └── supabase/migrations/  # SQL migration files
└── memory/          # Project documentation
```

## Current Status

### ✅ Completed (Phase 1 - Foundation)
- [x] Backend scaffolding with FastAPI routers
- [x] Frontend auth components (AdminSetup, TeacherAuth)
- [x] School selector dropdown component
- [x] Teacher signup flow with Supabase Auth
- [x] Admin creation flow (NEW: handles "user already registered" error)
- [x] API health check endpoints
- [x] Status check CRUD (MongoDB)
- [x] Migration files created for RBAC

### 🔄 In Progress
- [ ] **CRITICAL**: User must apply database migrations in Supabase SQL Editor
  - File: `/app/frontend/supabase/migrations/20250126000003_admin_role_final.sql`
  - File: `/app/frontend/supabase/migrations/20250126000004_add_email_to_teacher_profiles.sql`
  - Instructions: `/app/MIGRATION_INSTRUCTIONS.md`

### ⏳ Pending (After Migrations Applied)
- [ ] Verify complete Admin creation flow works end-to-end
- [ ] Verify Teacher signup flow works end-to-end
- [ ] Test role-based permissions

## P0 - Critical (Next Steps)
1. Apply database migrations to Supabase
2. Test Admin creation (new user + promote existing user)
3. Test Teacher signup
4. Integrate role-based UI permissions

## P1 - High Priority
- [ ] PDF watermarking implementation
- [ ] Secure PDF viewer with signed URLs
- [ ] Audit logging frontend integration
- [ ] Modern exam card redesign

## P2 - Medium Priority
- [ ] PDF version history
- [ ] Bulk student import (CSV/Excel)
- [ ] System configuration UI

## P3 - Future/Backlog
- [ ] Advanced analytics & reporting
- [ ] Notification system (SendGrid)
- [ ] Question bank
- [ ] Two-factor authentication

## Key Database Schema

### teacher_profiles
```sql
id UUID PRIMARY KEY
school_id UUID REFERENCES schools(id)
name TEXT NOT NULL
email TEXT              -- Added via migration
role TEXT DEFAULT 'teacher'  -- Added via migration: 'teacher', 'admin', 'super-admin'
department TEXT
subjects TEXT[]
created_at, updated_at
```

### schools
```sql
id UUID PRIMARY KEY
name TEXT NOT NULL
code TEXT UNIQUE NOT NULL  -- Format: ABC1234
address TEXT
contact_email TEXT
```

## API Endpoints
- `GET /api/` - Health check, returns operational status
- `GET /api/health` - Health check with timestamp
- `POST /api/status` - Create status check (MongoDB)
- `GET /api/status` - Get all status checks
- `POST /api/audit/log` - Create audit log entry
- `GET /api/audit/logs` - Get audit logs
- `GET /api/storage/signed_url` - Generate signed URL for files
- `GET /api/permissions/roles` - Get all roles
- `POST /api/permissions/check` - Check user permission

## Important Files
- `/app/MIGRATION_INSTRUCTIONS.md` - How to apply migrations
- `/app/frontend/supabase/migrations/` - SQL migration files
- `/app/frontend/src/components/Auth/AdminSetup.tsx` - Admin creation
- `/app/frontend/src/components/Auth/TeacherAuth.tsx` - Teacher auth
- `/app/backend/server.py` - Main API server

## Test Reports
- `/app/test_reports/iteration_1.json` - First test run results
- `/app/tests/test_backend_api.py` - Backend API tests

---
*Last updated: 2026-01-21*
