"use client";

import { NavLinks } from "@/components/layout/nav-links";

export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 border-r bg-background md:flex md:flex-col">
      <div className="flex h-16 items-center border-b px-6">
        <span className="text-lg font-semibold tracking-tight">MIA</span>
      </div>
      <NavLinks />
    </aside>
  );
}
