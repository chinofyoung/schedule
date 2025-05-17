"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { db } from "../../lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { Employee, ShiftType } from "../../types/employee";
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

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      // In a real implementation, this would generate the schedule
      // For now, we'll just show an alert
      console.log("Schedule data:", data);
      alert("Schedule creation will be implemented in a future version.");

      router.push("/schedules");
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
          <div className="border border-[var(--card-border)] bg-[var(--highlight-bg)] rounded-md p-4 max-h-60 overflow-y-auto">
            {employees.map((employee) => (
              <div
                key={employee.id}
                className="flex items-center mb-2 last:mb-0"
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
                  {employee.firstName} {employee.lastName} - {employee.position}
                </label>
              </div>
            ))}
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
