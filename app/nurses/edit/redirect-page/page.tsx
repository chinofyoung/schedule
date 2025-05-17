"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function RedirectToEditEmployee() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  useEffect(() => {
    // Redirect to edit employee page
    router.replace(`/employees/edit/${id}`);
  }, [router, id]);

  return (
    <div className="flex flex-col items-center justify-center py-10">
      <p className="text-[var(--foreground)] mb-4">
        Redirecting to Edit Employee...
      </p>
      <p className="text-[var(--muted-text)] mb-2">
        The Edit Nurse feature has been migrated to Edit Employee.
      </p>
      <Link
        href={`/employees/edit/${id}`}
        className="text-[var(--accent-primary)] hover:underline"
      >
        Click here if you are not automatically redirected
      </Link>
    </div>
  );
}
