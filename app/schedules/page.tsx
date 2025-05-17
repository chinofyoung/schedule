import Link from "next/link";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";

export default function SchedulesPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Manage Schedules</h1>
        <Link
          href="/schedules/create"
          className="bg-green-600 text-white px-4 py-2 rounded-md flex items-center hover:bg-green-700 transition-colors"
        >
          <CalendarDaysIcon className="w-5 h-5 mr-2" />
          Create Schedule
        </Link>
      </div>

      <div className="bg-slate-800 rounded-lg shadow p-6 text-center py-10">
        <p className="text-gray-500 mb-4">
          No schedules have been created yet.
        </p>
        <p>Click the "Create Schedule" button to get started.</p>
      </div>
    </div>
  );
}
