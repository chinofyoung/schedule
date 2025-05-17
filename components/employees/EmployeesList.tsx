"use client";

import { useState, useEffect } from "react";
import { Employee } from "../../types/employee";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

export default function EmployeesList() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const employeesCollection = collection(db, "employees");
        const employeesQuery = query(employeesCollection, orderBy("lastName"));
        const snapshot = await getDocs(employeesQuery);

        const employeesList: Employee[] = [];
        snapshot.forEach((doc) => {
          const employeeData = doc.data();
          employeesList.push({
            id: doc.id,
            firstName: employeeData.firstName,
            lastName: employeeData.lastName,
            mobileNumber: employeeData.mobileNumber,
            position: employeeData.position,
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

  if (loading) {
    return (
      <div className="text-center py-4 text-[var(--foreground)]">
        Loading...
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="text-center py-10 text-[var(--muted-text)]">
        <p className="mb-4">No employees have been added yet.</p>
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
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-[var(--card-border)]">
        <thead className="bg-[var(--highlight-bg)]">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-[var(--muted-text)] uppercase tracking-wider"
            >
              Name
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-[var(--muted-text)] uppercase tracking-wider"
            >
              Position
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-[var(--muted-text)] uppercase tracking-wider"
            >
              Mobile Number
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-[var(--muted-text)] uppercase tracking-wider"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-[var(--card-bg)] divide-y divide-[var(--card-border)]">
          {employees.map((employee) => (
            <tr key={employee.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-[var(--foreground)]">
                  {employee.firstName} {employee.lastName}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-[var(--foreground)]">
                  {employee.position}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-[var(--muted-text)]">
                  {employee.mobileNumber || "Not provided"}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex space-x-2">
                  <Link
                    href={`/employees/edit/${employee.id}`}
                    className="text-[var(--accent-primary)] hover:text-[color-mix(in_srgb,var(--accent-primary),white_20%)]"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </Link>
                  <button
                    onClick={() => {
                      // Delete functionality will be added later
                      alert("Delete functionality coming soon");
                    }}
                    className="text-[var(--accent-danger)] hover:text-[color-mix(in_srgb,var(--accent-danger),white_20%)]"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
