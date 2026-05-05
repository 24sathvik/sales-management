/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { memo } from "react";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { ChevronDown, LogOut } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const ROUTE_LABELS: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/invoices": "Invoices",
  "/dashboard/invoices/new": "New Invoice",
  "/dashboard/quotations": "Quotations",
  "/dashboard/work-in-progress": "Work in Progress",
  "/dashboard/final-check": "Final Check",
  "/dashboard/users": "Users",
  "/dashboard/accounts": "Accounts",
  "/dashboard/purchases": "Purchases",
};

function getTitle(pathname: string): string {
  if (ROUTE_LABELS[pathname]) return ROUTE_LABELS[pathname];
  if (pathname.includes("/invoices/") && pathname.includes("/edit")) return "Edit Invoice";
  if (pathname.includes("/invoices/")) return "Invoice Details";
  return "Dashboard";
}

function getBreadcrumbs(pathname: string) {
  const crumbs: { label: string; href: string }[] = [{ label: "Dashboard", href: "/dashboard" }];
  if (pathname === "/dashboard") return crumbs;

  const segments = pathname.replace("/dashboard/", "").split("/");
  let accumulated = "/dashboard";

  for (const seg of segments) {
    if (!seg) continue;
    accumulated += `/${seg}`;
    const label = ROUTE_LABELS[accumulated] || (seg.startsWith("INV-") ? seg : seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " "));
    crumbs.push({ label, href: accumulated });
  }

  return crumbs;
}

export const Header = memo(function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const name = session?.user?.name || "User";
  const role = session?.user?.role;
  const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  const title = getTitle(pathname);
  const breadcrumbs = getBreadcrumbs(pathname);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="h-[56px] bg-card border-b border-border px-6 flex items-center justify-between shrink-0 z-20 sticky top-0">
      {/* Left: Title + Breadcrumb */}
      <div className="flex flex-col justify-center">
        {breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 text-[14px]">
            {breadcrumbs.map((crumb, i) => {
              const isLast = i === breadcrumbs.length - 1;
              return (
                <span key={crumb.href} className="flex items-center gap-1.5">
                  {i > 0 && <span className="text-text-muted">/</span>}
                  {isLast ? (
                    <span className="text-text-heading font-semibold tracking-tight">{crumb.label}</span>
                  ) : (
                    <a href={crumb.href} className="text-text-secondary hover:text-text-heading transition-colors">{crumb.label}</a>
                  )}
                </span>
              );
            })}
          </nav>
        )}
      </div>

      {/* Right: User Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2.5 px-2 py-1 rounded-lg hover:bg-card-hover transition-colors text-[14px]"
        >
          <div 
            className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-white text-[12px] font-bold font-display"
            style={{ backgroundColor: 'var(--brand-gold)' }}
          >
            {initials}
          </div>
          <span className="hidden sm:block font-semibold text-text-heading max-w-[120px] truncate">{name}</span>
          <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-card rounded-xl border border-border shadow-lg z-50 py-1 animate-fade-in">
            <div className="px-4 py-3 border-b border-border">
              <div className="font-semibold text-[14px] text-text-heading">{name}</div>
              <div className="text-[12px] text-text-secondary mt-0.5 flex items-center gap-1.5">
                <span className={`inline-block w-2 h-2 rounded-full ${role === "ADMIN" ? "bg-status-success" : "bg-status-info"}`} />
                {role}
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] text-status-danger hover:bg-status-danger-bg transition-colors"
            >
              <LogOut className="w-[18px] h-[18px]" />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
});
