"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  UserIcon,
  CalendarIcon,
  HomeIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";

const MobileNavigation = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
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
    <div className="md:hidden">
      <div className="flex items-center justify-between p-4 border-b border-[var(--card-border)] bg-[var(--sidebar-bg)]">
        {" "}
        <span className="text-lg font-semibold text-[var(--accent-primary)]">
          Staff Scheduler
        </span>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="focus:outline-none text-[var(--foreground)]"
        >
          {isOpen ? (
            <XMarkIcon className="w-6 h-6" />
          ) : (
            <Bars3Icon className="w-6 h-6" />
          )}
        </button>
      </div>{" "}
      {isOpen && (
        <nav className="bg-[var(--sidebar-bg)] border-b border-[var(--card-border)]">
          <ul>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center space-x-3 px-4 py-3 ${
                      isActive
                        ? "bg-[var(--highlight-bg)] text-[var(--accent-primary)]"
                        : "text-[var(--foreground)] hover:bg-[var(--highlight-bg)]"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </div>
  );
};

export default MobileNavigation;
