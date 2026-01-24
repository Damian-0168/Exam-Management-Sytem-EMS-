# 🚨 CRITICAL: Run These Migrations First!

## The "role" Column Error

**Error:** `could not find the "role" column of "teacher_profiles" in the schema cache`

**Cause:** Database migration has not been executed yet.

**Solution:** Run the migrations in Supabase SQL Editor.

---

## Step-by-Step Migration Guide

### **Step 1: Access Supabase SQL Editor**

1. Go to your Supabase Dashboard
2. Navigate to: **SQL Editor** (left sidebar)
3. Click: **New Query**

### **Step 2: Run the Main Migration**

Copy and paste this migration file content into the SQL Editor:

**File:** `/app/frontend/supabase/migrations/20250126000003_admin_role_final.sql`

Click **RUN** to execute.

### **Step 3: Run the Email Column Migration (Optional but Recommended)**

Copy and paste this migration file content into the SQL Editor:

**File:** `/app/frontend/supabase/migrations/20250126000004_add_email_to_teacher_profiles.sql`

Click **RUN** to execute.

### **Step 4: Verify Migration Success**

Run this verification query:

```sql
-- Check if role column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'teacher_profiles' 
AND column_name IN ('role', 'email');

-- Should return two rows: role | text, email | text
```

If you see both columns, migration is successful! ✅

### **Step 4: Verify School Code Column**

```sql
-- Check if schools has code column
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'schools' 
AND column_name = 'code';

-- Should return: code | text
```

### **Step 5: Check Existing Data**

```sql
-- Check if you have any schools
SELECT id, name, code FROM schools LIMIT 5;

-- Check if you have any teacher profiles
SELECT id, name, role, school_id FROM teacher_profiles LIMIT 5;
```

---

## What the Migration Does

1. ✅ Adds `role` column to `teacher_profiles` (teacher, admin, super-admin)
2. ✅ Adds `school_id` to students, exams, exam_events (if missing)
3. ✅ Adds `teacher_id` to exams table
4. ✅ Creates helper functions (is_school_admin, get_user_school_id, get_user_role)
5. ✅ Updates ALL RLS policies for admin access
6. ✅ Handles legacy data without school_id

---

## After Migration

### **Verify Helper Functions Work:**

```sql
-- Test functions (replace with your user ID)
SELECT public.get_user_role('YOUR-USER-ID-HERE');
SELECT public.get_user_school_id('YOUR-USER-ID-HERE');
```

### **Update Existing Users (if needed):**

```sql
-- Make an existing user an admin
UPDATE teacher_profiles 
SET role = 'admin' 
WHERE email = 'admin@yourschool.com';

-- Add school_id to students without one
UPDATE students 
SET school_id = 'YOUR-SCHOOL-ID' 
WHERE school_id IS NULL;
```

---

## Common Errors & Solutions

### Error: "schools.code cannot be null"
**Solution:** Migration auto-generates codes, but if you have existing schools:
```sql
-- Update existing schools with codes
UPDATE schools 
SET code = UPPER(SUBSTRING(name, 1, 3)) || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0')
WHERE code IS NULL;
```

### Error: "duplicate key value violates unique constraint"
**Solution:** School code already exists
```sql
-- Check for duplicates
SELECT code, COUNT(*) FROM schools GROUP BY code HAVING COUNT(*) > 1;

-- Generate new unique codes
UPDATE schools SET code = code || '-' || id::text WHERE code IN (SELECT code FROM schools GROUP BY code HAVING COUNT(*) > 1);
```

---

## 🎯 Migration Success Checklist

- [ ] Migration SQL executed without errors
- [ ] `role` column exists in `teacher_profiles`
- [ ] `code` column exists in `schools`
- [ ] Helper functions created (is_school_admin, etc.)
- [ ] RLS policies updated
- [ ] Can query tables without permission errors

---

## If Migration Fails

**Common Issues:**

1. **Syntax Error**: Copy the entire migration file, don't paste in parts
2. **Permission Error**: Use Service Role key, not Anon key
3. **Column Already Exists**: Migration handles this with `IF NOT EXISTS`
4. **Foreign Key Error**: Ensure schools table exists first

**Get Help:**
- Check Supabase logs in Dashboard → Database → Logs
- Run each section separately to find which part fails
- Check that base tables (schools, teacher_profiles) exist

---

**After successful migration, all authentication features will work!** 🎉
