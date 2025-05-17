"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CalendarDaysIcon,
  EyeIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
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
        <div className="grid gap-4">
          {schedules.map((schedule) => (
            <Link
              key={schedule.id}
              href={`/schedules/${schedule.id}`}
              className="block bg-[var(--card-bg)] rounded-lg border border-[var(--card-border)] hover:border-[var(--accent-primary)] transition-colors"
            >
              <div className="p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center">
                <div className="mb-3 md:mb-0">
                  <h2 className="text-lg font-medium text-[var(--foreground)] mb-1">
                    {schedule.name}
                  </h2>
                  <div className="flex flex-wrap gap-4">
                    <p className="text-sm text-[var(--muted-text)]">
                      {formatDate(schedule.startDate)} -{" "}
                      {formatDate(schedule.endDate)}
                    </p>
                    <p className="text-sm text-[var(--muted-text)]">
                      {schedule.shiftType === "8hour"
                        ? "8 Hour Shifts"
                        : "12 Hour Shifts"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center text-[var(--accent-primary)]">
                  <EyeIcon className="w-4 h-4 mr-1" />
                  <span className="text-sm mr-1">View</span>
                  <ChevronRightIcon className="w-4 h-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
