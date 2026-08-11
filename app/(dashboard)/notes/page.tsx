"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { NoteEditor } from "@/components/notes/note-editor";
import { NoteCard } from "@/components/notes/note-card";
import type { Note } from "@/types/models";

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/notes")
      .then((res) => res.json())
      .then((data: { notes: Note[]; hasMore: boolean }) => {
        if (cancelled) return;
        setNotes(data.notes ?? []);
        setHasMore(data.hasMore ?? false);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const load = () => setReloadKey((k) => k + 1);

  const loadMore = async () => {
    setLoadingMore(true);
    const res = await fetch(`/api/notes?offset=${notes.length}`);
    const data: { notes: Note[]; hasMore: boolean } = await res.json();
    setNotes((prev) => [...prev, ...data.notes]);
    setHasMore(data.hasMore);
    setLoadingMore(false);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notes</h1>
          <p className="text-sm text-muted-foreground">
            Vos notes, avec résumés générés par IA.
          </p>
        </div>
        <NoteEditor onCreated={load} />
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground">Chargement...</p>
      ) : notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune note pour le moment.</p>
      ) : (
        <>
          <div className="space-y-4">
            {notes.map((note) => (
              <NoteCard key={note.id} note={note} onChanged={load} />
            ))}
          </div>
          {hasMore && (
            <Button variant="outline" size="sm" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? "Chargement..." : "Charger plus"}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
