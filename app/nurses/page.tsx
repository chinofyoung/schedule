"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RedirectToEmployees() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to employees page
    router.replace("/employees");
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center py-10">
      <p className="text-[var(--foreground)] mb-4">
        Redirecting to Employees...
      </p>
      <p className="text-[var(--muted-text)] mb-2">
        The Nurses section has been migrated to Employees section.
      </p>
      <Link
        href="/employees"
        className="text-[var(--accent-primary)] hover:underline"
      >
        Click here if you are not automatically redirected
      </Link>
    </div>
  );
}
