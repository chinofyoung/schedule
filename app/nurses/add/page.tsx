"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RedirectToAddEmployee() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to add employee page
    router.replace("/employees/add");
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center py-10">
      <p className="text-[var(--foreground)] mb-4">
        Redirecting to Add Employee...
      </p>
      <p className="text-[var(--muted-text)] mb-2">
        The Add Nurse feature has been migrated to Add Employee.
      </p>
      <Link
        href="/employees/add"
        className="text-[var(--accent-primary)] hover:underline"
      >
        Click here if you are not automatically redirected
      </Link>
    </div>
  );
}
