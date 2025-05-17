import { Suspense } from "react";
import Link from "next/link";
import { UserPlusIcon } from "@heroicons/react/24/outline";
import EmployeesList from "../../components/employees/EmployeesList";

export default function EmployeesPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Manage Employees</h1>
        <Link
          href="/employees/add"
          className="bg-[var(--accent-primary)] text-white px-4 py-2 rounded-md flex items-center hover:bg-[color-mix(in_srgb,var(--accent-primary),black_10%)] transition-colors"
        >
          <UserPlusIcon className="w-5 h-5 mr-2" />
          Add Employee
        </Link>
      </div>

      <div className="bg-[var(--card-bg)] rounded-lg shadow p-6 border border-[var(--card-border)]">
        <Suspense
          fallback={
            <div className="text-center py-10">Loading employees...</div>
          }
        >
          <EmployeesList />
        </Suspense>
      </div>
    </div>
  );
}
