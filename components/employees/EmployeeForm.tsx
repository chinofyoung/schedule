"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { db } from "../../lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { Employee, EmployeePosition } from "../../types/employee";
import Link from "next/link";

type FormData = Omit<Employee, "id">;

export default function EmployeeForm({
  employee,
  isEditing,
}: {
  employee?: Employee;
  isEditing?: boolean;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: employee
      ? {
          firstName: employee.firstName,
          lastName: employee.lastName,
          mobileNumber: employee.mobileNumber || "",
          position: employee.position,
        }
      : {
          firstName: "",
          lastName: "",
          mobileNumber: "",
          position: "Nurse 1" as EmployeePosition,
        },
  });
  const employeePositions: EmployeePosition[] = [
    "Nurse 1",
    "Nurse 2",
    "Nurse 3",
    "Nurse 4",
    "Midwife 1",
    "Midwife 2",
    "NA 1",
    "NA 2",
  ];

  // Helper function to get the position category
  const getPositionCategory = (position: EmployeePosition) => {
    if (position.startsWith("Nurse")) return "Nurse";
    if (position.startsWith("Midwife")) return "Midwife";
    if (position.startsWith("NA")) return "Nursing Attendant";
    return "Other";
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      if (isEditing && employee) {
        // TODO: Implement update functionality
        alert("Update functionality will be implemented later");
      } else {
        await addDoc(collection(db, "employees"), {
          ...data,
          requestedDaysOff: [],
        });
      }

      router.push("/employees");
      router.refresh();
    } catch (error) {
      console.error("Error saving employee:", error);
      alert("An error occurred while saving the employee.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 bg-[var(--card-bg)] p-6 rounded-md shadow-md border border-[var(--card-border)]"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="firstName"
            className="block text-sm font-medium text-[var(--foreground)]"
          >
            First Name*
          </label>
          <input
            id="firstName"
            type="text"
            {...register("firstName", { required: "First name is required" })}
            className={`mt-1 block w-full px-3 py-2 bg-[var(--highlight-bg)] border ${
              errors.firstName
                ? "border-[var(--accent-danger)]"
                : "border-[var(--card-border)]"
            } rounded-md shadow-sm focus:outline-none focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] text-[var(--foreground)]`}
          />
          {errors.firstName && (
            <p className="mt-1 text-sm text-[var(--accent-danger)]">
              {errors.firstName.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="lastName"
            className="block text-sm font-medium text-[var(--foreground)]"
          >
            Last Name*
          </label>
          <input
            id="lastName"
            type="text"
            {...register("lastName", { required: "Last name is required" })}
            className={`mt-1 block w-full px-3 py-2 bg-[var(--highlight-bg)] border ${
              errors.lastName
                ? "border-[var(--accent-danger)]"
                : "border-[var(--card-border)]"
            } rounded-md shadow-sm focus:outline-none focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] text-[var(--foreground)]`}
          />
          {errors.lastName && (
            <p className="mt-1 text-sm text-[var(--accent-danger)]">
              {errors.lastName.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="mobileNumber"
            className="block text-sm font-medium text-[var(--foreground)]"
          >
            Mobile Number (Optional)
          </label>
          <input
            id="mobileNumber"
            type="tel"
            {...register("mobileNumber")}
            className="mt-1 block w-full px-3 py-2 bg-[var(--highlight-bg)] border border-[var(--card-border)] rounded-md shadow-sm focus:outline-none focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] text-[var(--foreground)]"
          />
        </div>

        <div>
          <label
            htmlFor="position"
            className="block text-sm font-medium text-[var(--foreground)]"
          >
            Position*
          </label>
          <select
            id="position"
            {...register("position", { required: "Position is required" })}
            className={`mt-1 block w-full px-3 py-2 bg-[var(--highlight-bg)] border ${
              errors.position
                ? "border-[var(--accent-danger)]"
                : "border-[var(--card-border)]"
            } rounded-md shadow-sm focus:outline-none focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] text-[var(--foreground)]`}
          >
            <optgroup label="Nurses">
              <option value="Nurse 1">Nurse 1</option>
              <option value="Nurse 2">Nurse 2</option>
              <option value="Nurse 3">Nurse 3</option>
              <option value="Nurse 4">Nurse 4</option>
            </optgroup>
            <optgroup label="Midwives">
              <option value="Midwife 1">Midwife 1</option>
              <option value="Midwife 2">Midwife 2</option>
            </optgroup>
            <optgroup label="Nursing Attendants">
              <option value="NA 1">NA 1</option>
              <option value="NA 2">NA 2</option>
            </optgroup>
          </select>
          {errors.position && (
            <p className="mt-1 text-sm text-[var(--accent-danger)]">
              {errors.position.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <Link
          href="/employees"
          className="px-4 py-2 border border-[var(--card-border)] rounded-md shadow-sm text-sm font-medium text-[var(--foreground)] bg-[var(--highlight-bg)] hover:bg-[color-mix(in_srgb,var(--highlight-bg),black_10%)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent-primary)]"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--accent-primary)] hover:bg-[color-mix(in_srgb,var(--accent-primary),black_10%)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent-primary)] disabled:opacity-50"
        >
          {isSubmitting
            ? "Saving..."
            : isEditing
            ? "Update Employee"
            : "Add Employee"}
        </button>
      </div>
    </form>
  );
}
