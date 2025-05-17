"use client";

import Link from "next/link";
import { UserIcon, CalendarIcon, ClockIcon } from "@heroicons/react/24/outline";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useEffect, useState } from "react";

export default function Home() {
  const [employeeCount, setEmployeeCount] = useState(0);
  const [scheduleCount, setScheduleCount] = useState(0);
  const [upcomingShifts, setUpcomingShifts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mostRecentSchedule, setMostRecentSchedule] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch employee count
        const employeesSnapshot = await getDocs(collection(db, "employees"));
        setEmployeeCount(employeesSnapshot.size);

        // Fetch schedule count
        const allSchedulesSnapshot = await getDocs(collection(db, "schedules"));
        setScheduleCount(allSchedulesSnapshot.size);

        // Fetch most recent schedule
        const recentSchedulesQuery = query(
          collection(db, "schedules"),
          orderBy("createdAt", "desc"),
          limit(1)
        );
        const schedulesSnapshot = await getDocs(recentSchedulesQuery);

        // Get most recent schedule
        if (!schedulesSnapshot.empty) {
          const recentSchedule = schedulesSnapshot.docs[0];
          setMostRecentSchedule({
            id: recentSchedule.id,
            name: recentSchedule.data().name
          });
        }

        // Fetch upcoming shifts (shifts in the next 7 days)
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);

        const upcomingSchedulesQuery = query(
          collection(db, "schedules"),
          where("startDate", "<=", nextWeek.toISOString()),
          where("endDate", ">=", today.toISOString())
        );

        const upcomingSchedules = await getDocs(upcomingSchedulesQuery);
        let totalUpcomingShifts = 0;

        upcomingSchedules.forEach((doc) => {
          const schedule = doc.data();
          const shifts = schedule.shifts || [];
          totalUpcomingShifts += shifts.length;
        });

        setUpcomingShifts(totalUpcomingShifts);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)] mx-auto"></div>
        <p className="mt-2 text-[var(--muted-text)]">Loading dashboard...</p>
      </div>
    );
  }

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
              <p className="text-2xl font-bold">{employeeCount}</p>
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
              <p className="text-2xl font-bold">{scheduleCount}</p>
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
              <p className="text-2xl font-bold">{upcomingShifts}</p>
            </div>
          </div>
          {mostRecentSchedule ? (
            <Link
              href={`/schedules/${mostRecentSchedule.id}`}
              className="block mt-4 text-[var(--accent-secondary)] text-sm hover:underline"
            >
              View {mostRecentSchedule.name} &rarr;
            </Link>
          ) : (
            <Link
              href="/schedules"
              className="block mt-4 text-[var(--accent-secondary)] text-sm hover:underline"
            >
              View shifts &rarr;
            </Link>
          )}
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
