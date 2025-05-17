"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserIcon, CalendarIcon, HomeIcon } from "@heroicons/react/24/outline";
import MobileNavigation from "./MobileNavigation";

const Navigation = () => {
  const pathname = usePathname();
  const navItems = [
    { href: "/", label: "Dashboard", icon: <HomeIcon className="w-5 h-5" /> },
    {
      href: "/employees",
      label: "Employees",
      icon: <UserIcon className="w-5 h-5" />,
    },
    {
      href: "/schedules",
      label: "Schedules",
      icon: <CalendarIcon className="w-5 h-5" />,
    },
  ];

  return (
    <>
      <MobileNavigation />{" "}
      <nav className="w-64 bg-[var(--sidebar-bg)] border-r border-[var(--card-border)] hidden md:block">
        <div className="p-4 flex flex-col h-full">
          {" "}
          <div className="text-xl font-bold py-4 text-center text-[var(--accent-primary)] border-b border-[var(--card-border)] mb-6">
            Staff Scheduler
          </div>
          <ul className="space-y-2 flex-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-md transition-colors ${
                      isActive
                        ? "bg-[var(--highlight-bg)] text-[var(--accent-primary)]"
                        : "text-[var(--foreground)] hover:bg-[var(--highlight-bg)]"
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}{" "}
          </ul>
          <div className="border-t border-[var(--card-border)] pt-4 text-xs text-[var(--muted-text)]">
            <p>© 2025 Nurse Scheduler</p>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navigation;
