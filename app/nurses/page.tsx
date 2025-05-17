import { Suspense } from "react";
import Link from "next/link";
import { UserPlusIcon } from "@heroicons/react/24/outline";
import NursesList from "../../components/nurses/NursesList";

export default function NursesPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Manage Nurses</h1>
        <Link
          href="/nurses/add"
          className="bg-indigo-600 text-white px-4 py-2 rounded-md flex items-center hover:bg-indigo-700 transition-colors"
        >
          <UserPlusIcon className="w-5 h-5 mr-2" />
          Add Nurse
        </Link>
      </div>

      <div className="bg-slate-800 rounded-lg shadow p-6">
        <Suspense
          fallback={<div className="text-center py-10">Loading nurses...</div>}
        >
          <NursesList />
        </Suspense>
      </div>
    </div>
  );
}
