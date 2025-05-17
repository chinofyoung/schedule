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
  const [searchQuery, setSearchQuery] = useState("");

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

  // Filter employees based on search query
  const filteredEmployees = employees.filter((employee) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      employee.firstName.toLowerCase().includes(searchLower) ||
      employee.lastName.toLowerCase().includes(searchLower) ||
      employee.position.toLowerCase().includes(searchLower) ||
      (employee.mobileNumber && employee.mobileNumber.includes(searchQuery))
    );
  });

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

  // Group employees by position category and job number
  const groupedEmployees = filteredEmployees.reduce((acc, employee) => {
    let category = "Other";
    let jobNumber = "0";
    
    // Determine category and job number
    if (employee.position.startsWith("Nurse")) {
      category = "Nurses";
      const match = employee.position.match(/\d+/);
      jobNumber = match ? match[0] : "0";
    } else if (employee.position.startsWith("Midwife")) {
      category = "Midwives";
      const match = employee.position.match(/\d+/);
      jobNumber = match ? match[0] : "0";
    } else if (employee.position.startsWith("NA")) {
      category = "Nursing Attendants";
      const match = employee.position.match(/\d+/);
      jobNumber = match ? match[0] : "0";
    }
    
    if (!acc[category]) {
      acc[category] = {};
    }
    if (!acc[category][jobNumber]) {
      acc[category][jobNumber] = [];
    }
    acc[category][jobNumber].push(employee);
    return acc;
  }, {} as Record<string, Record<string, Employee[]>>);

  // Sort categories in a specific order
  const categoryOrder = ["Nurses", "Midwives", "Nursing Attendants", "Other"];
  
  const sortedCategories = Object.keys(groupedEmployees).sort(
    (a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b)
  );

  // Color mapping for job numbers
  const jobNumberColors = {
    "1": "bg-blue-100 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
    "2": "bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-800",
    "3": "bg-purple-100 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800",
    "4": "bg-orange-100 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800",
    "5": "bg-pink-100 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800",
    "6": "bg-teal-100 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800",
    "7": "bg-yellow-100 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
    "8": "bg-indigo-100 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800",
    "0": "bg-gray-100 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800",
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="text"
          placeholder="Search employees by name, position, or mobile number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 pl-10 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent"
        />
        <svg
          className="absolute left-3 top-2.5 h-5 w-5 text-[var(--muted-text)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {Object.keys(groupedEmployees).length === 0 ? (
        <div className="text-center py-8 text-[var(--muted-text)]">
          No employees found matching your search.
        </div>
      ) : (
        <div className="divide-y divide-[var(--card-border)]">
          {sortedCategories.map((category) => (
            <div key={category} className="py-4 first:pt-0 last:pb-0">
              <h2 className="text-base font-semibold text-[var(--foreground)] flex items-center gap-2 mb-3">
                <span>{category}</span>
                <span className="text-sm text-[var(--muted-text)]">
                  ({Object.values(groupedEmployees[category] || {}).flat().length})
                </span>
              </h2>
              <div className="space-y-4">
                {Object.keys(groupedEmployees[category] || {})
                  .sort((a, b) => parseInt(a) - parseInt(b))
                  .map((jobNumber) => {
                    const jobEmployees = groupedEmployees[category]?.[jobNumber] || [];
                    if (jobEmployees.length === 0) return null;
                    
                    const colorClass = jobNumberColors[jobNumber as keyof typeof jobNumberColors] || jobNumberColors["0"];
                    
                    return (
                      <div key={jobNumber} className="relative">
                        <div className={`absolute -left-3 top-0 bottom-0 w-0.5 ${colorClass.split(' ')[0]}`}></div>
                        <div className="pl-3">
                          <div className={`rounded-lg p-3 ${colorClass}`}>
                            <h3 className="text-sm font-medium text-[var(--foreground)] flex items-center gap-2 mb-2">
                              <span>{category} {jobNumber !== "0" ? jobNumber : ""}</span>
                              <span className="text-xs text-[var(--muted-text)]">
                                ({jobEmployees.length})
                              </span>
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                              {jobEmployees.map((employee) => (
                                <div
                                  key={employee.id}
                                  className="bg-[var(--card-bg)] rounded-lg border border-[var(--card-border)] p-2 hover:border-[var(--accent-primary)] transition-colors"
                                >
                                  <div className="flex justify-between items-start">
                                    <div className="min-w-0 flex-1">
                                      <h3 className="font-medium text-[var(--foreground)] text-sm truncate">
                                        {employee.firstName} {employee.lastName}
                                      </h3>
                                      <div className="flex items-center gap-2 text-xs text-[var(--muted-text)]">
                                        <span className="truncate">{employee.position}</span>
                                        {employee.mobileNumber && (
                                          <span className="truncate">• {employee.mobileNumber}</span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex space-x-1 ml-2">
                                      <Link
                                        href={`/employees/edit/${employee.id}`}
                                        className="text-[var(--accent-primary)] hover:text-[color-mix(in_srgb,var(--accent-primary),white_20%)]"
                                      >
                                        <PencilIcon className="w-4 h-4" />
                                      </Link>
                                      <button
                                        onClick={() => {
                                          // Delete functionality will be added later
                                          alert("Delete functionality coming soon");
                                        }}
                                        className="text-[var(--accent-danger)] hover:text-[color-mix(in_srgb,var(--accent-danger),white_20%)]"
                                      >
                                        <TrashIcon className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
