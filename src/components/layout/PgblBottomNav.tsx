"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Grid3X3, House, Images, Map, Plane } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { PgblRouteId } from "@/types/navigation";

const navItems: Array<{
  id: PgblRouteId;
  href: string;
  label: string;
  icon: LucideIcon;
  soon?: boolean;
}> = [
  { id: "tour360", href: "/tour360", label: "Flycam 360", icon: Plane },
  { id: "giohang", href: "/giohang", label: "Sản phẩm", icon: Grid3X3 },
  { id: "tienich", href: "/tienich", label: "Tiện ích", icon: Map },
  { id: "nhamau", href: "#", label: "Nhà mẫu", icon: House, soon: true },
  { id: "gallery", href: "#", label: "Gallery", icon: Images, soon: true },
  { id: "ebro", href: "/ebro", label: "E-Brochure", icon: BookOpen },
];

function activeId(pathname: string): PgblRouteId | "" {
  const segment = pathname.split("/").filter(Boolean)[0] ?? "";
  return navItems.some((item) => item.id === segment) ? (segment as PgblRouteId) : "";
}

export function PgblBottomNav() {
  const pathname = usePathname();
  if (
    pathname.startsWith("/tour360") ||
    pathname.startsWith("/giohang") ||
    pathname.startsWith("/tienich") ||
    pathname.startsWith("/ebro")
  ) {
    return null;
  }

  const current = activeId(pathname);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-2.5 pb-[calc(8px+env(safe-area-inset-bottom))] pt-2 font-sans pointer-events-none">
      <div className="pointer-events-auto flex w-full max-w-[760px] gap-0.5 rounded-2xl border border-[var(--pgbl-line)] bg-[rgba(14,40,33,.82)] p-1.5 shadow-[0_10px_34px_rgba(0,0,0,.42)] backdrop-blur-2xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = current === item.id;

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2 text-center transition ${
                active
                  ? "bg-[rgba(95,229,190,.14)] text-[var(--pgbl-accent)]"
                  : "text-[var(--pgbl-text-muted)] hover:bg-[rgba(159,220,76,.10)] hover:text-[var(--pgbl-text)]"
              }`}
            >
              {active && (
                <span className="absolute left-1/2 top-[3px] h-[3px] w-5 -translate-x-1/2 rounded bg-[linear-gradient(90deg,#9BDC4C,#5FE5BE)]" />
              )}
              {item.soon && (
                <span className="absolute right-1 top-0.5 rounded-md bg-[var(--pgbl-gold)] px-1 py-px text-[8px] font-bold uppercase tracking-[.4px] text-[var(--pgbl-base)] max-sm:hidden">
                  Sắp có
                </span>
              )}
              <Icon className="h-[22px] w-[22px] shrink-0 max-sm:h-5 max-sm:w-5" strokeWidth={1.7} />
              <span className="truncate text-[11px] font-medium tracking-normal max-sm:text-[9.5px]">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
