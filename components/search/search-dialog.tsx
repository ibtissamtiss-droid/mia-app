"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, CheckSquare, CalendarDays, NotebookText, Receipt } from "lucide-react";

type SearchResults = {
  tasks: { id: string; title: string; status: string }[];
  events: { id: string; title: string; startTime: string }[];
  notes: { id: string; title: string }[];
  documents: { id: string; number: string; clientName: string; type: string }[];
};

const EMPTY_RESULTS: SearchResults = { tasks: [], events: [], notes: [], documents: [] };

export function SearchDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>(EMPTY_RESULTS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const timeout = setTimeout(() => {
      if (query.trim().length < 2) {
        setResults(EMPTY_RESULTS);
        return;
      }
      setLoading(true);
      fetch(`/api/search?q=${encodeURIComponent(query)}`)
        .then((res) => res.json())
        .then((data) => setResults(data))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timeout);
  }, [query, open]);

  const go = (path: string) => {
    setOpen(false);
    setQuery("");
    router.push(path);
  };

  const hasResults =
    results.tasks.length > 0 ||
    results.events.length > 0 ||
    results.notes.length > 0 ||
    results.documents.length > 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setQuery("");
      }}
    >
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="w-9 justify-center text-muted-foreground sm:w-56 sm:justify-start"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Rechercher...</span>
          </Button>
        }
      />
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Recherche</DialogTitle>
        </DialogHeader>
        <Input
          autoFocus
          placeholder="Rechercher une tâche, note, événement, devis..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="max-h-96 space-y-4 overflow-y-auto">
          {loading && <p className="text-sm text-muted-foreground">Recherche...</p>}
          {!loading && query.trim().length >= 2 && !hasResults && (
            <p className="text-sm text-muted-foreground">Aucun résultat.</p>
          )}

          {results.tasks.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Tâches</p>
              {results.tasks.map((t) => (
                <button
                  key={t.id}
                  onClick={() => go("/tasks")}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-secondary"
                >
                  <CheckSquare className="h-4 w-4 text-muted-foreground" />
                  {t.title}
                </button>
              ))}
            </div>
          )}

          {results.events.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Événements</p>
              {results.events.map((e) => (
                <button
                  key={e.id}
                  onClick={() => go("/calendar")}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-secondary"
                >
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  {e.title}
                </button>
              ))}
            </div>
          )}

          {results.notes.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Notes</p>
              {results.notes.map((n) => (
                <button
                  key={n.id}
                  onClick={() => go("/notes")}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-secondary"
                >
                  <NotebookText className="h-4 w-4 text-muted-foreground" />
                  {n.title}
                </button>
              ))}
            </div>
          )}

          {results.documents.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Devis & Factures</p>
              {results.documents.map((d) => (
                <button
                  key={d.id}
                  onClick={() => go(`/invoicing/${d.id}`)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-secondary"
                >
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                  {d.number} — {d.clientName}
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
