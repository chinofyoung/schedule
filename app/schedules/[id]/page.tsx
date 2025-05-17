"use client";

import { useState, useEffect } from "react";
import { db } from "../../../lib/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import Link from "next/link";
import { Employee, ScheduleShift } from "../../../types/employee";
import { useParams, useRouter } from "next/navigation";
import * as XLSX from 'xlsx';
import { ArrowDownTrayIcon, TrashIcon } from "@heroicons/react/24/outline";

interface Schedule {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  shiftType: "8hour" | "12hour";
  shifts: ScheduleShift[];
  createdAt: string;
  scheduleDayOffRequests?: Record<string, string[]>;
}

export default function ScheduleDetails() {
  const params = useParams();
  const router = useRouter();
  const scheduleId = params.id as string;

  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [employees, setEmployees] = useState<Record<string, Employee>>({});
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  // Calculate total hours for an employee
  const calculateEmployeeHours = (employeeId: string): number => {
    if (!schedule) return 0;
    const employeeShifts = schedule.shifts.filter(shift => shift.employeeId === employeeId);
    const hoursPerShift = schedule.shiftType === "8hour" ? 8 : 12;
    return employeeShifts.length * hoursPerShift;
  };

  // Get day off requests for an employee
  const getEmployeeDayOffRequests = (employeeId: string): string[] => {
    if (!schedule?.scheduleDayOffRequests) return [];
    return schedule.scheduleDayOffRequests[employeeId] || [];
  };

  // Fetch schedule and related employees
  useEffect(() => {
    const fetchScheduleAndEmployees = async () => {
      try {
        setLoading(true);

        // Fetch schedule data
        const scheduleRef = doc(db, "schedules", scheduleId);
        const scheduleDoc = await getDoc(scheduleRef);

        if (!scheduleDoc.exists()) {
          console.error("Schedule not found");
          router.push("/schedules");
          return;
        }

        const scheduleData = scheduleDoc.data() as Omit<Schedule, "id">;
        const fetchedSchedule: Schedule = {
          ...scheduleData,
          id: scheduleDoc.id,
        };

        setSchedule(fetchedSchedule);

        // Get unique employee IDs from shifts
        const employeeIds = Array.from(
          new Set(fetchedSchedule.shifts.map((shift) => shift.employeeId))
        );

        if (employeeIds.length > 0) {
          // Fetch employee data
          const employeesMap: Record<string, Employee> = {};

          for (const employeeId of employeeIds) {
            const employeeRef = doc(db, "employees", employeeId);
            const employeeDoc = await getDoc(employeeRef);

            if (employeeDoc.exists()) {
              employeesMap[employeeId] = {
                ...(employeeDoc.data() as Omit<Employee, "id">),
                id: employeeDoc.id,
              };
            }
          }

          setEmployees(employeesMap);
        }
      } catch (error) {
        console.error("Error fetching schedule:", error);
      } finally {
        setLoading(false);
      }
    };

    if (scheduleId) {
      fetchScheduleAndEmployees();
    }
  }, [scheduleId, router]);

  // Group shifts by date
  const getShiftsByDate = () => {
    if (!schedule) return {};

    const shiftsByDate: Record<string, ScheduleShift[]> = {};

    schedule.shifts.forEach((shift) => {
      if (!shiftsByDate[shift.date]) {
        shiftsByDate[shift.date] = [];
      }

      shiftsByDate[shift.date].push(shift);
    });

    return shiftsByDate;
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  // Export schedule to XLSX
  const exportToExcel = () => {
    if (!schedule || !employees) return;

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    
    // Prepare data for the main schedule sheet
    const scheduleData = [
      ['Schedule Details'],
      ['Name:', schedule.name],
      ['Date Range:', `${formatDate(schedule.startDate)} - ${formatDate(schedule.endDate)}`],
      ['Shift Type:', schedule.shiftType === "8hour" ? "8 Hour Shifts" : "12 Hour Shifts"],
      [''],
      ['Schedule Calendar']
    ];

    // Add shifts by date
    const shiftsByDate = getShiftsByDate();
    const sortedDates = Object.keys(shiftsByDate).sort();

    sortedDates.forEach(date => {
      scheduleData.push([formatDate(date)]);
      
      if (schedule.shiftType === "8hour") {
        scheduleData.push(['Morning (7am - 3pm)']);
        shiftsByDate[date]
          .filter(s => s.shiftName === "morning")
          .forEach(shift => {
            const employee = employees[shift.employeeId];
            if (employee) {
              scheduleData.push([
                `${employee.firstName} ${employee.lastName}`,
                employee.position,
                shift.isPointPerson ? 'Point Person' : ''
              ]);
            }
          });

        scheduleData.push(['Afternoon (3pm - 11pm)']);
        shiftsByDate[date]
          .filter(s => s.shiftName === "afternoon")
          .forEach(shift => {
            const employee = employees[shift.employeeId];
            if (employee) {
              scheduleData.push([
                `${employee.firstName} ${employee.lastName}`,
                employee.position,
                shift.isPointPerson ? 'Point Person' : ''
              ]);
            }
          });

        scheduleData.push(['Night (11pm - 7am)']);
        shiftsByDate[date]
          .filter(s => s.shiftName === "night")
          .forEach(shift => {
            const employee = employees[shift.employeeId];
            if (employee) {
              scheduleData.push([
                `${employee.firstName} ${employee.lastName}`,
                employee.position,
                shift.isPointPerson ? 'Point Person' : ''
              ]);
            }
          });
      } else {
        scheduleData.push(['Day (7am - 7pm)']);
        shiftsByDate[date]
          .filter(s => s.shiftName === "day")
          .forEach(shift => {
            const employee = employees[shift.employeeId];
            if (employee) {
              scheduleData.push([
                `${employee.firstName} ${employee.lastName}`,
                employee.position,
                shift.isPointPerson ? 'Point Person' : ''
              ]);
            }
          });

        scheduleData.push(['Night (7pm - 7am)']);
        shiftsByDate[date]
          .filter(s => s.shiftName === "night")
          .forEach(shift => {
            const employee = employees[shift.employeeId];
            if (employee) {
              scheduleData.push([
                `${employee.firstName} ${employee.lastName}`,
                employee.position,
                shift.isPointPerson ? 'Point Person' : ''
              ]);
            }
          });
      }
      scheduleData.push(['']); // Add empty row between dates
    });

    // Add employee summary sheet
    const employeeData = [
      ['Employee Summary'],
      ['Name', 'Position', 'Total Hours', 'Day Off Requests']
    ];

    Object.entries(employees).forEach(([employeeId, employee]) => {
      const totalHours = calculateEmployeeHours(employeeId);
      const dayOffRequests = getEmployeeDayOffRequests(employeeId);
      
      employeeData.push([
        `${employee.firstName} ${employee.lastName}`,
        employee.position,
        totalHours.toString(),
        dayOffRequests.map(date => formatDate(date)).join(', ')
      ]);
    });

    // Create worksheets
    const wsSchedule = XLSX.utils.aoa_to_sheet(scheduleData);
    const wsEmployees = XLSX.utils.aoa_to_sheet(employeeData);

    // Add worksheets to workbook
    XLSX.utils.book_append_sheet(wb, wsSchedule, 'Schedule');
    XLSX.utils.book_append_sheet(wb, wsEmployees, 'Employee Summary');

    // Generate Excel file
    XLSX.writeFile(wb, `${schedule.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_schedule.xlsx`);
  };

  // Delete schedule
  const handleDelete = async () => {
    if (!schedule) return;

    if (!confirm(`Are you sure you want to delete the schedule "${schedule.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setIsDeleting(true);
      const scheduleRef = doc(db, "schedules", scheduleId);
      await deleteDoc(scheduleRef);
      router.push("/schedules");
      router.refresh();
    } catch (error) {
      console.error("Error deleting schedule:", error);
      alert("An error occurred while deleting the schedule.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading schedule...</div>;
  }

  if (!schedule) {
    return (
      <div className="text-center py-10 text-[var(--muted-text)]">
        <p>Schedule not found.</p>
        <Link
          href="/schedules"
          className="text-[var(--accent-primary)] hover:underline"
        >
          Back to Schedules
        </Link>
      </div>
    );
  }

  const shiftsByDate = getShiftsByDate();
  const sortedDates = Object.keys(shiftsByDate).sort();

  return (
    <div className="max-w-5xl mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          {schedule.name}
        </h1>
        <div className="flex gap-3">
          <button
            onClick={exportToExcel}
            className="px-4 py-2 bg-[var(--accent-success)] text-white rounded border border-[var(--card-border)] hover:bg-[color-mix(in_srgb,var(--accent-success),black_10%)] flex items-center gap-2"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            Export to Excel
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 bg-[var(--accent-danger)] text-white rounded border border-[var(--card-border)] hover:bg-[color-mix(in_srgb,var(--accent-danger),black_10%)] flex items-center gap-2 disabled:opacity-50"
          >
            <TrashIcon className="w-5 h-5" />
            {isDeleting ? "Deleting..." : "Delete Schedule"}
          </button>
          <Link
            href="/schedules"
            className="px-4 py-2 bg-[var(--highlight-bg)] text-[var(--foreground)] rounded border border-[var(--card-border)] hover:bg-[color-mix(in_srgb,var(--highlight-bg),black_10%)]"
          >
            Back to Schedules
          </Link>
        </div>
      </div>

      <div className="bg-[var(--card-bg)] rounded-lg border border-[var(--card-border)] p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-[var(--muted-text)]">Date Range</p>
            <p className="text-[var(--foreground)]">
              {formatDate(schedule.startDate)} - {formatDate(schedule.endDate)}
            </p>
          </div>
          <div>
            <p className="text-sm text-[var(--muted-text)]">Shift Type</p>
            <p className="text-[var(--foreground)]">
              {schedule.shiftType === "8hour"
                ? "8 Hour Shifts"
                : "12 Hour Shifts"}
            </p>
          </div>
          <div>
            <p className="text-sm text-[var(--muted-text)]">Employee Count</p>
            <p className="text-[var(--foreground)]">
              {Object.keys(employees).length}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4 text-[var(--foreground)]">
          Schedule Calendar
        </h2>

        <div className="space-y-6">
          {sortedDates.map((date) => (
            <div
              key={date}
              className="bg-[var(--card-bg)] rounded-lg border border-[var(--card-border)] p-4"
            >
              <h3 className="text-lg font-medium text-[var(--foreground)] mb-3">
                {formatDate(date)}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Group shifts by shift name (morning/afternoon/night or day/night) */}
                {schedule.shiftType === "8hour" ? (
                  <>
                    <ShiftCard
                      title="Morning (7am - 3pm)"
                      shifts={shiftsByDate[date].filter(
                        (s) => s.shiftName === "morning"
                      )}
                      employees={employees}
                    />
                    <ShiftCard
                      title="Afternoon (3pm - 11pm)"
                      shifts={shiftsByDate[date].filter(
                        (s) => s.shiftName === "afternoon"
                      )}
                      employees={employees}
                    />
                    <ShiftCard
                      title="Night (11pm - 7am)"
                      shifts={shiftsByDate[date].filter(
                        (s) => s.shiftName === "night"
                      )}
                      employees={employees}
                    />
                  </>
                ) : (
                  <>
                    <ShiftCard
                      title="Day (7am - 7pm)"
                      shifts={shiftsByDate[date].filter(
                        (s) => s.shiftName === "day"
                      )}
                      employees={employees}
                      className="md:col-span-2"
                    />
                    <ShiftCard
                      title="Night (7pm - 7am)"
                      shifts={shiftsByDate[date].filter(
                        (s) => s.shiftName === "night"
                      )}
                      employees={employees}
                    />
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Employee Summary */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">
          Employee Summary
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(employees).map(([employeeId, employee]) => {
            const totalHours = calculateEmployeeHours(employeeId);
            const dayOffRequests = getEmployeeDayOffRequests(employeeId);

            return (
              <div
                key={employeeId}
                className="bg-[var(--card-bg)] rounded-lg p-4 border border-[var(--card-border)]"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium text-[var(--foreground)]">
                      {employee.firstName} {employee.lastName}
                    </h3>
                    <p className="text-sm text-[var(--muted-text)]">
                      {employee.position}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-[var(--accent-primary)]">
                    {totalHours} hours
                  </span>
                </div>
                {dayOffRequests.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-[var(--muted-text)] mb-1">
                      Day Off Requests:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {dayOffRequests.map((date) => (
                        <span
                          key={date}
                          className="inline-block px-2 py-1 bg-[var(--highlight-bg)] rounded text-xs text-[var(--foreground)]"
                        >
                          {new Date(date).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface ShiftCardProps {
  title: string;
  shifts: ScheduleShift[];
  employees: Record<string, Employee>;
  className?: string;
}

function ShiftCard({
  title,
  shifts,
  employees,
  className = "",
}: ShiftCardProps) {
  // Get role-specific color
  const getEmployeeColor = (employee: Employee): string => {
    if (employee.position.startsWith("Nurse")) {
      return "var(--accent-primary)";
    } else if (employee.position.startsWith("Midwife")) {
      return "var(--accent-secondary)";
    } else {
      return "var(--accent-success)";
    }
  };

  return (
    <div className={`bg-[var(--highlight-bg)] rounded p-3 ${className}`}>
      <h4 className="font-medium text-[var(--foreground)] mb-2">{title}</h4>

      {shifts.length === 0 ? (
        <p className="text-sm text-[var(--muted-text)] italic">
          No employees assigned
        </p>
      ) : (
        <ul className="space-y-2">
          {shifts.map((shift) => {
            const employee = employees[shift.employeeId];
            if (!employee) return null;

            return (
              <li
                key={`${shift.date}-${shift.shiftName}-${shift.employeeId}`}
                className="flex items-center"
              >
                <div
                  className="w-2 h-2 rounded-full mr-2"
                  style={{ backgroundColor: getEmployeeColor(employee) }}
                />
                <span className="text-sm text-[var(--foreground)]">
                  {employee.firstName} {employee.lastName}{" "}
                  <span className="text-xs text-[var(--muted-text)]">
                    ({employee.position})
                  </span>
                  {shift.isPointPerson && (
                    <span className="ml-1 text-xs font-medium text-[var(--accent-primary)]">
                      (Point Person)
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
