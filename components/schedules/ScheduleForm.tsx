"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { db } from "../../lib/firebase";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { Employee, ShiftType, ScheduleShift } from "../../types/employee";
import Link from "next/link";

// Define the form data structure
type FormData = {
  name: string;
  startDate: string;
  endDate: string;
  shiftType: ShiftType;
  employees: string[]; // Array of selected employee IDs
};

export default function ScheduleForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      name: "",
      startDate: "",
      endDate: "",
      shiftType: "8hour",
      employees: [],
    },
  });

  // Watch the selected shift type to show appropriate shift options
  const selectedShiftType = watch("shiftType");
  // Fetch employees from Firestore
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const employeesCollection = collection(db, "employees");
        const employeesSnapshot = await getDocs(employeesCollection);

        const employeesList: Employee[] = [];
        employeesSnapshot.forEach((doc) => {
          const employeeData = doc.data();
          employeesList.push({
            id: doc.id,
            firstName: employeeData.firstName,
            lastName: employeeData.lastName,
            position: employeeData.position,
            mobileNumber: employeeData.mobileNumber,
            requestedDaysOff: employeeData.requestedDaysOff || [],
          });
        });

        setEmployees(employeesList);
      } catch (error) {
        console.error("Error fetching employees:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);
  // Helper function to generate dates between start and end dates
  const generateDateRange = (startDate: string, endDate: string): string[] => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dateArray = [];

    // Create a new date object to avoid modifying the original
    let currentDate = new Date(start);

    // Loop from start date to end date
    while (currentDate <= end) {
      dateArray.push(currentDate.toISOString().split("T")[0]);
      // Add one day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dateArray;
  };

  // Helper function to check if an employee has requested a day off
  const hasRequestedDayOff = (employee: Employee, date: string): boolean => {
    return (employee.requestedDaysOff || []).includes(date);
  };

  // Helper to check if an employee is a senior nurse (Nurse 3 or Nurse 4)
  const isSeniorNurse = (employee: Employee): boolean => {
    return employee.position === "Nurse 3" || employee.position === "Nurse 4";
  };

  // Helper to check if employee is a nursing attendant
  const isNursingAttendant = (employee: Employee): boolean => {
    return employee.position === "NA 1" || employee.position === "NA 2";
  };

  // Helper to check if employee is a midwife
  const isMidwife = (employee: Employee): boolean => {
    return (
      employee.position === "Midwife 1" || employee.position === "Midwife 2"
    );
  };

  // Get shift names based on shift type
  const getShiftNames = (shiftType: ShiftType): string[] => {
    return shiftType === "8hour"
      ? ["morning", "afternoon", "night"]
      : ["day", "night"];
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      // Get the selected employees from the form data
      const selectedEmployees = employees.filter((emp) =>
        data.employees.includes(emp.id)
      );

      if (selectedEmployees.length === 0) {
        alert("Please select at least one employee for the schedule.");
        return;
      }

      // Generate the range of dates for the schedule
      const dateRange = generateDateRange(data.startDate, data.endDate);

      if (dateRange.length === 0) {
        alert("Invalid date range. End date must be after start date.");
        return;
      }

      // Get shift names based on selected shift type
      const shiftNames = getShiftNames(data.shiftType);

      // Create a map to track hours assigned to each employee per week
      const employeeWeeklyHours: Record<string, number> = {};
      selectedEmployees.forEach((emp) => {
        employeeWeeklyHours[emp.id] = 0;
      });

      // Create shifts for each date in the range
      const shifts: ScheduleShift[] = [];

      // Generate shifts for each date
      for (const date of dateRange) {
        // Calculate the week number for this date
        const currentDate = new Date(date);
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay()); // Start of week (Sunday)
        const weekKey = weekStart.toISOString().split('T')[0];

        // For each shift type on this date
        for (const shiftName of shiftNames) {
          // Create shift for available employees
          // Sort employees by hours assigned (ascending) to ensure even distribution
          const availableEmployees = selectedEmployees
            .filter((emp) => {
              // Check if employee has requested this day off
              if (hasRequestedDayOff(emp, date)) return false;
              
              // Check if employee has reached 40 hours this week
              const hoursThisWeek = employeeWeeklyHours[emp.id] || 0;
              const shiftHours = data.shiftType === "8hour" ? 8 : 12;
              return hoursThisWeek + shiftHours <= 40;
            })
            .sort((a, b) => (employeeWeeklyHours[a.id] || 0) - (employeeWeeklyHours[b.id] || 0));

          if (availableEmployees.length === 0) continue;

          // Ensure we have a senior nurse if possible
          const seniorNurses = availableEmployees.filter((emp) =>
            isSeniorNurse(emp)
          );
          const midwives = availableEmployees.filter((emp) => isMidwife(emp));
          const nursingAttendants = availableEmployees.filter((emp) =>
            isNursingAttendant(emp)
          );

          // Prioritize employees by role
          const prioritizedEmployees = [
            ...(seniorNurses.length > 0 ? [seniorNurses[0]] : []), // Add senior nurse if available
            ...(midwives.length > 0 ? [midwives[0]] : []), // Add midwife if available
            ...(nursingAttendants.length > 0 ? [nursingAttendants[0]] : []), // Add NA if available
          ];

          // Add other available employees
          const otherEmployees = availableEmployees.filter(
            (emp) => !prioritizedEmployees.includes(emp)
          );

          // Sort other employees by hours to ensure even distribution
          otherEmployees.sort(
            (a, b) => (employeeWeeklyHours[a.id] || 0) - (employeeWeeklyHours[b.id] || 0)
          );

          // Combine prioritized and other employees
          const assignedEmployees = [
            ...prioritizedEmployees,
            ...otherEmployees,
          ];

          // Limit to number of needed employees per shift
          // For 8-hour shifts, we'll assign 3-4 employees
          // For 12-hour shifts, we'll assign 4-5 employees
          const employeesPerShift = data.shiftType === "8hour" ? 3 : 4;
          const employeesToAssign = assignedEmployees.slice(
            0,
            employeesPerShift
          );

          // Assign employees to shift
          employeesToAssign.forEach((emp) => {
            // Add shift
            shifts.push({
              date,
              shiftType: data.shiftType,
              shiftName,
              employeeId: emp.id,
              // First employee in each shift (ideally senior nurse) is point person
              isPointPerson: emp.id === employeesToAssign[0].id,
            });

            // Track hours worked for the week
            const hoursWorked = data.shiftType === "8hour" ? 8 : 12;
            employeeWeeklyHours[emp.id] = (employeeWeeklyHours[emp.id] || 0) + hoursWorked;
          });
        }
      }

      // Check if we have enough employees to cover all shifts
      const totalShiftsNeeded = dateRange.length * shiftNames.length;
      if (shifts.length < totalShiftsNeeded) {
        alert("Warning: Not enough employees available to cover all shifts while respecting the 40-hour work week limit. Some shifts may be understaffed.");
      }

      // Save the schedule to Firestore
      const schedule = {
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
        shiftType: data.shiftType,
        shifts: shifts,
        createdAt: new Date().toISOString(),
      };

      // Save to Firebase
      const docRef = await addDoc(collection(db, "schedules"), schedule);
      console.log("Schedule created with ID: ", docRef.id);

      // Redirect to schedules list
      router.push("/schedules");
      router.refresh();
    } catch (error) {
      console.error("Error creating schedule:", error);
      alert("An error occurred while creating the schedule.");
    } finally {
      setIsSubmitting(false);
    }
  };
  if (loading) {
    return <div className="text-center py-4">Loading employees...</div>;
  }

  if (employees.length === 0) {
    return (
      <div className="text-center py-10 text-[var(--muted-text)]">
        <p className="mb-4">
          You need to add employees before creating a schedule.
        </p>
        <Link
          href="/employees/add"
          className="text-[var(--accent-primary)] hover:underline"
        >
          Add your first employee
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label
            htmlFor="name"
            className="block text-sm font-medium text-[var(--foreground)]"
          >
            Schedule Name*
          </label>
          <input
            id="name"
            type="text"
            {...register("name", { required: "Schedule name is required" })}
            placeholder="e.g., May Schedule"
            className={`mt-1 block w-full px-3 py-2 bg-[var(--highlight-bg)] border ${
              errors.name
                ? "border-[var(--accent-danger)]"
                : "border-[var(--card-border)]"
            } rounded-md shadow-sm focus:outline-none focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] text-[var(--foreground)]`}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-[var(--accent-danger)]">
              {errors.name.message}
            </p>
          )}
        </div>{" "}
        <div>
          <label
            htmlFor="startDate"
            className="block text-sm font-medium text-[var(--foreground)]"
          >
            Start Date*
          </label>
          <input
            id="startDate"
            type="date"
            {...register("startDate", { required: "Start date is required" })}
            className={`mt-1 block w-full px-3 py-2 bg-[var(--highlight-bg)] border ${
              errors.startDate
                ? "border-[var(--accent-danger)]"
                : "border-[var(--card-border)]"
            } rounded-md shadow-sm focus:outline-none focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] text-[var(--foreground)]`}
          />
          {errors.startDate && (
            <p className="mt-1 text-sm text-[var(--accent-danger)]">
              {errors.startDate.message}
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="endDate"
            className="block text-sm font-medium text-[var(--foreground)]"
          >
            End Date*
          </label>
          <input
            id="endDate"
            type="date"
            {...register("endDate", { required: "End date is required" })}
            className={`mt-1 block w-full px-3 py-2 bg-[var(--highlight-bg)] border ${
              errors.endDate
                ? "border-[var(--accent-danger)]"
                : "border-[var(--card-border)]"
            } rounded-md shadow-sm focus:outline-none focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] text-[var(--foreground)]`}
          />
          {errors.endDate && (
            <p className="mt-1 text-sm text-[var(--accent-danger)]">
              {errors.endDate.message}
            </p>
          )}
        </div>{" "}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
            Shift Type*
          </label>
          <div className="flex space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                value="8hour"
                {...register("shiftType", {
                  required: "Shift type is required",
                })}
                className="h-4 w-4 text-[var(--accent-primary)] focus:ring-[var(--accent-primary)] border-[var(--card-border)]"
              />
              <span className="ml-2 text-sm text-[var(--foreground)]">
                8 Hour Shifts (7am-3pm, 3pm-11pm, 11pm-7am)
              </span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                value="12hour"
                {...register("shiftType", {
                  required: "Shift type is required",
                })}
                className="h-4 w-4 text-[var(--accent-primary)] focus:ring-[var(--accent-primary)] border-[var(--card-border)]"
              />
              <span className="ml-2 text-sm text-[var(--foreground)]">
                12 Hour Shifts (7am-7pm, 7pm-7am)
              </span>
            </label>
          </div>
          {errors.shiftType && (
            <p className="mt-1 text-sm text-[var(--accent-danger)]">
              {errors.shiftType.message}
            </p>
          )}
        </div>{" "}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
            Select Employees*
          </label>
          <div className="border border-[var(--card-border)] bg-[var(--highlight-bg)] rounded-md p-4 max-h-80 overflow-y-auto">
            {/* Nurses Section */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-[var(--accent-primary)] mb-2">
                Nurses
              </h3>
              {employees
                .filter((emp) => emp.position.startsWith("Nurse"))
                .map((employee) => (
                  <div
                    key={employee.id}
                    className="flex items-center mb-2 last:mb-0 pl-2"
                  >
                    <input
                      type="checkbox"
                      id={`employee-${employee.id}`}
                      value={employee.id}
                      {...register("employees", {
                        required: "At least one employee must be selected",
                      })}
                      className="h-4 w-4 text-[var(--accent-primary)] focus:ring-[var(--accent-primary)] border-[var(--card-border)] rounded"
                    />
                    <label
                      htmlFor={`employee-${employee.id}`}
                      className="ml-2 text-sm text-[var(--foreground)]"
                    >
                      {employee.firstName} {employee.lastName} -{" "}
                      {employee.position}
                      {isSeniorNurse(employee) && (
                        <span className="ml-1 text-xs text-[var(--accent-primary)]">
                          (Senior)
                        </span>
                      )}
                    </label>
                  </div>
                ))}
            </div>

            {/* Midwives Section */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-[var(--accent-secondary)] mb-2">
                Midwives
              </h3>
              {employees
                .filter((emp) => emp.position.startsWith("Midwife"))
                .map((employee) => (
                  <div
                    key={employee.id}
                    className="flex items-center mb-2 last:mb-0 pl-2"
                  >
                    <input
                      type="checkbox"
                      id={`employee-${employee.id}`}
                      value={employee.id}
                      {...register("employees", {
                        required: "At least one employee must be selected",
                      })}
                      className="h-4 w-4 text-[var(--accent-secondary)] focus:ring-[var(--accent-secondary)] border-[var(--card-border)] rounded"
                    />
                    <label
                      htmlFor={`employee-${employee.id}`}
                      className="ml-2 text-sm text-[var(--foreground)]"
                    >
                      {employee.firstName} {employee.lastName} -{" "}
                      {employee.position}
                    </label>
                  </div>
                ))}
            </div>

            {/* Nursing Attendants Section */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--accent-success)] mb-2">
                Nursing Attendants
              </h3>
              {employees
                .filter((emp) => emp.position.startsWith("NA"))
                .map((employee) => (
                  <div
                    key={employee.id}
                    className="flex items-center mb-2 last:mb-0 pl-2"
                  >
                    <input
                      type="checkbox"
                      id={`employee-${employee.id}`}
                      value={employee.id}
                      {...register("employees", {
                        required: "At least one employee must be selected",
                      })}
                      className="h-4 w-4 text-[var(--accent-success)] focus:ring-[var(--accent-success)] border-[var(--card-border)] rounded"
                    />
                    <label
                      htmlFor={`employee-${employee.id}`}
                      className="ml-2 text-sm text-[var(--foreground)]"
                    >
                      {employee.firstName} {employee.lastName} -{" "}
                      {employee.position}
                    </label>
                  </div>
                ))}
            </div>
          </div>
          {errors.employees && (
            <p className="mt-1 text-sm text-[var(--accent-danger)]">
              {errors.employees.message}
            </p>
          )}
        </div>
      </div>{" "}
      <div className="flex justify-end space-x-3">
        <Link
          href="/schedules"
          className="px-4 py-2 border border-[var(--card-border)] rounded-md shadow-sm text-sm font-medium text-[var(--foreground)] bg-[var(--highlight-bg)] hover:bg-[color-mix(in_srgb,var(--highlight-bg),black_10%)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent-primary)]"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--accent-success)] hover:bg-[color-mix(in_srgb,var(--accent-success),black_10%)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent-success)] disabled:opacity-50"
        >
          {isSubmitting ? "Creating..." : "Create Schedule"}
        </button>
      </div>
    </form>
  );
}
