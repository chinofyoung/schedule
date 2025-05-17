import { Suspense } from "react";
import ScheduleForm from "../../../components/schedules/ScheduleForm";

export default function CreateSchedulePage() {
  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold mb-6">
        Create New Schedule
      </h1>

      <div className="bg-slate-800 rounded-lg shadow p-6">
        <Suspense
          fallback={<div className="text-center py-10">Loading...</div>}
        >
          <ScheduleForm />
        </Suspense>
      </div>
    </div>
  );
}
