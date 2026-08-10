"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";

type Notifications = {
  overdueTasks: { id: string; title: string; dueDate: string }[];
  dueTodayTasks: { id: string; title: string; dueDate: string }[];
  upcomingEvents: { id: string; title: string; startTime: string }[];
};

const EMPTY: Notifications = { overdueTasks: [], dueTodayTasks: [], upcomingEvents: [] };

export function NotificationBell() {
  const [data, setData] = useState<Notifications>(EMPTY);

  useEffect(() => {
    const load = () => {
      fetch("/api/notifications")
        .then((res) => res.json())
        .then((d) => setData(d));
    };
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, []);

  const count = data.overdueTasks.length + data.dueTodayTasks.length + data.upcomingEvents.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative flex h-8 w-8 items-center justify-center rounded-full outline-none hover:bg-secondary">
        <Bell className="h-4 w-4" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] text-destructive-foreground">
            {count}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-2">
        {count === 0 ? (
          <p className="p-2 text-sm text-muted-foreground">Rien à signaler.</p>
        ) : (
          <div className="max-h-80 space-y-3 overflow-y-auto">
            {data.overdueTasks.length > 0 && (
              <div>
                <p className="mb-1 px-2 text-xs font-medium text-destructive">En retard</p>
                {data.overdueTasks.map((t) => (
                  <Link
                    key={t.id}
                    href="/tasks"
                    className="block rounded-md px-2 py-1.5 text-sm hover:bg-secondary"
                  >
                    {t.title}
                  </Link>
                ))}
              </div>
            )}
            {data.dueTodayTasks.length > 0 && (
              <div>
                <p className="mb-1 px-2 text-xs font-medium text-muted-foreground">
                  À faire aujourd&apos;hui
                </p>
                {data.dueTodayTasks.map((t) => (
                  <Link
                    key={t.id}
                    href="/tasks"
                    className="block rounded-md px-2 py-1.5 text-sm hover:bg-secondary"
                  >
                    {t.title}
                  </Link>
                ))}
              </div>
            )}
            {data.upcomingEvents.length > 0 && (
              <div>
                <p className="mb-1 px-2 text-xs font-medium text-muted-foreground">
                  Événements à venir
                </p>
                {data.upcomingEvents.map((e) => (
                  <Link
                    key={e.id}
                    href="/calendar"
                    className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-secondary"
                  >
                    <span>{e.title}</span>
                    <Badge variant="outline" className="shrink-0">
                      {new Date(e.startTime).toLocaleString("fr-FR", {
                        weekday: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
