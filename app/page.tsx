import Link from "next/link";
import { UserIcon, CalendarIcon, ClockIcon } from "@heroicons/react/24/outline";

export default function Home() {
  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold mb-6">
        Staff Schedule Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Summary Cards */}
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-[color-mix(in_srgb,var(--accent-primary),transparent_80%)]">
              <UserIcon className="w-8 h-8 text-[var(--accent-primary)]" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold">Employees</h2>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
          <Link
            href="/employees"
            className="block mt-4 text-[var(--accent-primary)] text-sm hover:underline"
          >
            Manage employees &rarr;
          </Link>
        </div>

        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-[color-mix(in_srgb,var(--accent-success),transparent_80%)]">
              <CalendarIcon className="w-8 h-8 text-[var(--accent-success)]" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold">Schedules</h2>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
          <Link
            href="/schedules"
            className="block mt-4 text-[var(--accent-success)] text-sm hover:underline"
          >
            Create schedule &rarr;
          </Link>
        </div>

        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-[color-mix(in_srgb,var(--accent-secondary),transparent_80%)]">
              <ClockIcon className="w-8 h-8 text-[var(--accent-secondary)]" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold">Upcoming Shifts</h2>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
          <Link
            href="/schedules"
            className="block mt-4 text-[var(--accent-secondary)] text-sm hover:underline"
          >
            View shifts &rarr;
          </Link>
        </div>
      </div>

      <div className="mt-8 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/employees/add"
              className="flex items-center p-4 border border-[var(--card-border)] rounded-md hover:bg-[var(--highlight-bg)] transition-colors"
            >
              <UserIcon className="w-6 h-6 text-[var(--accent-primary)] mr-3" />
              <div>
                <h3 className="font-medium">Add a new employee</h3>
                <p className="text-sm text-[var(--muted-text)]">
                  Create a new employee profile
                </p>
              </div>
            </Link>
            <Link
              href="/schedules/create"
              className="flex items-center p-4 border border-[var(--card-border)] rounded-md hover:bg-[var(--highlight-bg)] transition-colors"
            >
              <CalendarIcon className="w-6 h-6 text-[var(--accent-success)] mr-3" />
              <div>
                <h3 className="font-medium">Create a new schedule</h3>
                <p className="text-sm text-[var(--muted-text)]">
                  Generate a new work schedule
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
