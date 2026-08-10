"use client";

import { useSession, signOut } from "next-auth/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SearchDialog } from "@/components/search/search-dialog";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { MobileNav } from "@/components/layout/mobile-nav";

function initials(name?: string | null, email?: string | null) {
  if (name) {
    return name
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }
  return email?.[0]?.toUpperCase() ?? "?";
}

export function Topbar() {
  const { data: session } = useSession();

  return (
    <header className="flex h-16 items-center justify-between gap-2 border-b bg-background px-4 md:px-6">
      <div className="flex items-center gap-2">
        <MobileNav />
        <SearchDialog />
      </div>
      <div className="flex items-center gap-2">
        <NotificationBell />
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-full outline-none">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {initials(session?.user?.name, session?.user?.email)}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem disabled className="opacity-100">
              {session?.user?.email}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
              Se déconnecter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
