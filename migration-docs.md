# Nurse to Employee Terminology Change Documentation

## Files and Changes Required

### Types Changes

- ✅ Created `types/employee.ts` based on `types/nurse.ts`
  - Changed `NursePosition` to `EmployeePosition`
  - Changed `Nurse` interface to `Employee`
  - Changed `nurseId` to `employeeId` in `ScheduleShift`

### Component Changes

- ✅ Created `components/employees/EmployeeForm.tsx` based on `components/nurses/NurseForm.tsx`
- ✅ Created `components/employees/EmployeesList.tsx` based on `components/nurses/NursesList.tsx`
- ❌ Need to update `components/schedules/ScheduleForm.tsx`:
  - Change nurse references to employee
  - Update Firestore collection references from "nurses" to "employees"
  - Change form field from "nurses" to "employees"

### Page Changes

- ✅ Updated navigation references from `/nurses` to `/employees`
- ✅ Created `/app/employees/page.tsx`
- ✅ Created `/app/employees/add/page.tsx`
- ✅ Created `/app/employees/edit/[id]/page.tsx`
- ✅ Updated card and language on Dashboard page

### Database Changes

- ❌ Need to create migration script to:
  - Create new "employees" Firestore collection
  - Transfer data from "nurses" to "employees"
  - Update any references to "nurses" in schedules

## Steps to Complete the Migration

1. Finish updating the `ScheduleForm.tsx` component
2. Create a migration script to transfer data
3. Test the application functionality
4. Redirect old `/nurses` routes to `/employees`

## Risk Assessment

The migration may cause temporary data inconsistency if users access the old "nurses" routes during the transition. Consider adding redirects or temporarily disabling certain features during the migration process.
