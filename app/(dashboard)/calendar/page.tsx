"use client";

import { useEffect, useState } from "react";
import { EventForm } from "@/components/calendar/event-form";
import { CalendarView } from "@/components/calendar/calendar-view";
import { PageSpinner } from "@/components/ui/page-spinner";
import type { Event } from "@/types/models";

export default function CalendarPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/events")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setEvents(data.events ?? []);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const load = () => setReloadKey((k) => k + 1);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Calendrier</h1>
          <p className="text-sm text-muted-foreground">Vos rendez-vous et événements.</p>
        </div>
        <EventForm onCreated={load} />
      </div>
      {loading ? (
        <PageSpinner />
      ) : (
        <CalendarView events={events} onChanged={load} />
      )}
    </div>
  );
}
