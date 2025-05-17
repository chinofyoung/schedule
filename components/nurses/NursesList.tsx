"use client";

import { useState, useEffect } from "react";
import { Nurse } from "../../types/nurse";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

export default function NursesList() {
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNurses = async () => {
      try {
        const nursesCollection = collection(db, "nurses");
        const nursesQuery = query(nursesCollection, orderBy("lastName"));
        const snapshot = await getDocs(nursesQuery);

        const nursesList: Nurse[] = [];
        snapshot.forEach((doc) => {
          const nurseData = doc.data();
          nursesList.push({
            id: doc.id,
            firstName: nurseData.firstName,
            lastName: nurseData.lastName,
            mobileNumber: nurseData.mobileNumber,
            position: nurseData.position,
            requestedDaysOff: nurseData.requestedDaysOff || [],
          });
        });

        setNurses(nursesList);
      } catch (error) {
        console.error("Error fetching nurses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNurses();
  }, []);
  if (loading) {
    return (
      <div className="text-center py-4 text-[var(--foreground)]">
        Loading...
      </div>
    );
  }
  if (nurses.length === 0) {
    return (
      <div className="text-center py-10 text-[var(--muted-text)]">
        <p className="mb-4">No nurses have been added yet.</p>
        <Link
          href="/nurses/add"
          className="text-[var(--accent-primary)] hover:underline"
        >
          Add your first nurse
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
              {" "}
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
          {nurses.map((nurse) => (
            <tr key={nurse.id}>
              {" "}
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-[var(--foreground)]">
                  {nurse.firstName} {nurse.lastName}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-[var(--foreground)]">
                  {nurse.position}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-[var(--muted-text)]">
                  {nurse.mobileNumber || "Not provided"}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex space-x-2">
                  <Link
                    href={`/nurses/edit/${nurse.id}`}
                    className="text-[var(--accent-primary)] hover:text-[color-mix(in_srgb,var(--accent-primary),white_20%)]"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </Link>{" "}
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
