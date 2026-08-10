"use client";

import { NavLinks } from "@/components/layout/nav-links";
import { Logo } from "@/components/logo";

export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 border-r bg-background md:flex md:flex-col">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Logo className="h-6 w-6" />
        <span className="text-lg font-semibold tracking-tight">MIA</span>
      </div>
      <NavLinks />
    </aside>
  );
}
