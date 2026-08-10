"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Event } from "@/types/models";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

type ViewMode = "month" | "week";

function startOfMonthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const dayOfWeek = (first.getDay() + 6) % 7; // Monday = 0
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - dayOfWeek);
  return gridStart;
}

function startOfWeek(date: Date) {
  const dayOfWeek = (date.getDay() + 6) % 7; // Monday = 0
  const start = new Date(date);
  start.setDate(date.getDate() - dayOfWeek);
  start.setHours(0, 0, 0, 0);
  return start;
}

export function CalendarView({ events, onChanged }: { events: Event[]; onChanged: () => void }) {
  const [cursor, setCursor] = useState(() => new Date());
  const [view, setView] = useState<ViewMode>("month");

  const monthDays = useMemo(() => {
    const gridStart = startOfMonthGrid(cursor.getFullYear(), cursor.getMonth());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      return d;
    });
  }, [cursor]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(cursor);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
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
    for (const list of map.values()) {
      list.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    }
    return map;
  }, [events]);

  const removeEvent = async (id: string) => {
    await fetch(`/api/events/${id}`, { method: "DELETE" });
    onChanged();
  };

  const goPrev = () => {
    if (view === "month") {
      setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1));
    } else {
      const d = new Date(cursor);
      d.setDate(d.getDate() - 7);
      setCursor(d);
    }
  };

  const goNext = () => {
    if (view === "month") {
      setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1));
    } else {
      const d = new Date(cursor);
      d.setDate(d.getDate() + 7);
      setCursor(d);
    }
  };

  const label =
    view === "month"
      ? cursor.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
      : (() => {
          const start = weekDays[0];
          const end = weekDays[6];
          const sameMonth = start.getMonth() === end.getMonth();
          const startLabel = start.toLocaleDateString("fr-FR", { day: "numeric" });
          const endLabel = end.toLocaleDateString("fr-FR", {
            day: "numeric",
            month: sameMonth ? undefined : "long",
          });
          const monthYear = end.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
          return `${startLabel} – ${endLabel} ${monthYear}`;
        })();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-medium capitalize">{label}</h2>
        <div className="flex items-center gap-2">
          <Tabs value={view} onValueChange={(v) => setView(v as ViewMode)}>
            <TabsList>
              <TabsTrigger value="month">Mois</TabsTrigger>
              <TabsTrigger value="week">Semaine</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" onClick={goPrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={goNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {view === "month" ? (
        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-md border bg-border text-xs">
          {WEEKDAYS.map((d) => (
            <div key={d} className="bg-muted p-2 text-center font-medium">
              {d}
            </div>
          ))}
          {monthDays.map((day) => {
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
      ) : (
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-md border bg-border text-sm sm:grid-cols-7">
          {weekDays.map((day) => {
            const dayEvents = eventsByDay.get(day.toDateString()) ?? [];
            const isToday = day.toDateString() === new Date().toDateString();
            return (
              <div key={day.toISOString()} className="min-h-48 bg-background p-2">
                <div
                  className={cn(
                    "mb-2 flex items-center justify-between text-xs font-medium",
                    isToday && "text-primary"
                  )}
                >
                  <span>{WEEKDAYS[(day.getDay() + 6) % 7]}</span>
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full",
                      isToday && "bg-primary text-primary-foreground"
                    )}
                  >
                    {day.getDate()}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {dayEvents.length === 0 && (
                    <p className="text-xs text-muted-foreground">—</p>
                  )}
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      className="group rounded bg-secondary px-2 py-1 text-secondary-foreground"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-medium">
                          {new Date(event.startTime).toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <button
                          onClick={() => removeEvent(event.id)}
                          className="hidden text-muted-foreground group-hover:block"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="truncate text-xs">{event.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
