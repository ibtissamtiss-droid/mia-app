"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Event } from "@/types/models";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function startOfMonthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const dayOfWeek = (first.getDay() + 6) % 7; // Monday = 0
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - dayOfWeek);
  return gridStart;
}

export function CalendarView({ events, onChanged }: { events: Event[]; onChanged: () => void }) {
  const [cursor, setCursor] = useState(() => new Date());

  const days = useMemo(() => {
    const gridStart = startOfMonthGrid(cursor.getFullYear(), cursor.getMonth());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      return d;
    });
  }, [cursor]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, Event[]>();
    for (const event of events) {
      const key = new Date(event.startTime).toDateString();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(event);
    }
    return map;
  }, [events]);

  const removeEvent = async (id: string) => {
    await fetch(`/api/events/${id}`, { method: "DELETE" });
    onChanged();
  };

  const monthLabel = cursor.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium capitalize">{monthLabel}</h2>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-md border bg-border text-xs">
        {WEEKDAYS.map((d) => (
          <div key={d} className="bg-muted p-2 text-center font-medium">
            {d}
          </div>
        ))}
        {days.map((day) => {
          const inMonth = day.getMonth() === cursor.getMonth();
          const dayEvents = eventsByDay.get(day.toDateString()) ?? [];
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-24 bg-background p-1.5 align-top",
                !inMonth && "bg-muted/30 text-muted-foreground"
              )}
            >
              <div className="mb-1 text-right">{day.getDate()}</div>
              <div className="space-y-1">
                {dayEvents.map((event) => (
                  <div
                    key={event.id}
                    className="group flex items-center justify-between gap-1 rounded bg-secondary px-1.5 py-0.5 text-secondary-foreground"
                  >
                    <span className="truncate">{event.title}</span>
                    <button
                      onClick={() => removeEvent(event.id)}
                      className="hidden text-muted-foreground group-hover:block"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
