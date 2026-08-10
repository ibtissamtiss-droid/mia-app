"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Trash2 } from "lucide-react";
import type { Note } from "@/types/models";

export function NoteCard({ note, onChanged }: { note: Note; onChanged: () => void }) {
  const [summarizing, setSummarizing] = useState(false);

  const summarize = async () => {
    setSummarizing(true);
    const res = await fetch(`/api/notes/${note.id}/summarize`, { method: "POST" });
    setSummarizing(false);
    if (res.ok) onChanged();
  };

  const remove = async () => {
    await fetch(`/api/notes/${note.id}`, { method: "DELETE" });
    onChanged();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <CardTitle className="text-base">{note.title}</CardTitle>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" onClick={summarize} disabled={summarizing}>
            <Sparkles className="h-3.5 w-3.5" />
            {summarizing ? "Résumé..." : "Résumer avec IA"}
          </Button>
          <Button variant="ghost" size="icon" onClick={remove}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {note.summary && (
          <p className="rounded-md bg-secondary p-2 text-sm text-secondary-foreground">
            {note.summary}
          </p>
        )}
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">{note.content}</p>
      </CardContent>
    </Card>
  );
}
