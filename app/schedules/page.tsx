"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CalendarDaysIcon,
  EyeIcon,
  ChevronRightIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { collection, getDocs, query, orderBy, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../lib/firebase";

interface Schedule {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  shiftType: "8hour" | "12hour";
  createdAt: string;
}

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch schedules from Firestore
  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        setLoading(true);
        const schedulesCollection = collection(db, "schedules");
        const schedulesQuery = query(
          schedulesCollection,
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(schedulesQuery);

        const schedulesData: Schedule[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          schedulesData.push({
            id: doc.id,
            name: data.name,
            startDate: data.startDate,
            endDate: data.endDate,
            shiftType: data.shiftType,
            createdAt: data.createdAt,
          });
        });

        setSchedules(schedulesData);
      } catch (error) {
        console.error("Error fetching schedules:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedules();
  }, []);

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  // Handle schedule deletion
  const handleDelete = async (scheduleId: string, scheduleName: string) => {
    if (!confirm(`Are you sure you want to delete the schedule "${scheduleName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingId(scheduleId);
      const scheduleRef = doc(db, "schedules", scheduleId);
      await deleteDoc(scheduleRef);
      setSchedules(schedules.filter(s => s.id !== scheduleId));
    } catch (error) {
      console.error("Error deleting schedule:", error);
      alert("An error occurred while deleting the schedule.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--foreground)]">
          Manage Schedules
        </h1>
        <Link
          href="/schedules/create"
          className="bg-[var(--accent-success)] text-white px-4 py-2 rounded-md flex items-center hover:bg-[color-mix(in_srgb,var(--accent-success),black_10%)] transition-colors"
        >
          <CalendarDaysIcon className="w-5 h-5 mr-2" />
          Create Schedule
        </Link>
      </div>

      {loading ? (
        <div className="bg-[var(--card-bg)] rounded-lg border border-[var(--card-border)] p-6 text-center py-10">
          <p className="text-[var(--muted-text)]">Loading schedules...</p>
        </div>
      ) : schedules.length === 0 ? (
        <div className="bg-[var(--card-bg)] rounded-lg border border-[var(--card-border)] p-6 text-center py-10">
          <p className="text-[var(--muted-text)] mb-4">
            No schedules have been created yet.
          </p>
          <p className="text-[var(--foreground)]">
            Click the "Create Schedule" button to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="bg-[var(--card-bg)] rounded-lg border border-[var(--card-border)] p-4 hover:border-[var(--accent-primary)] transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-lg font-semibold text-[var(--foreground)]">
                  {schedule.name}
                </h2>
                <button
                  onClick={() => handleDelete(schedule.id, schedule.name)}
                  disabled={deletingId === schedule.id}
                  className="text-[var(--accent-danger)] hover:text-[color-mix(in_srgb,var(--accent-danger),black_10%)] disabled:opacity-50"
                  title="Delete Schedule"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-[var(--muted-text)]">
                  <CalendarDaysIcon className="w-4 h-4 mr-2" />
                  <span>
                    {formatDate(schedule.startDate)} - {formatDate(schedule.endDate)}
                  </span>
                </div>
                <p className="text-sm text-[var(--muted-text)]">
                  {schedule.shiftType === "8hour" ? "8 Hour Shifts" : "12 Hour Shifts"}
                </p>
              </div>
              <div className="flex justify-between items-center">
                <Link
                  href={`/schedules/${schedule.id}`}
                  className="text-[var(--accent-primary)] hover:underline text-sm flex items-center"
                >
                  <EyeIcon className="w-4 h-4 mr-1" />
                  View Details
                </Link>
                <span className="text-xs text-[var(--muted-text)]">
                  {new Date(schedule.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
