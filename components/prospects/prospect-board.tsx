"use client";

import { useState } from "react";
import { ProspectCard } from "@/components/prospects/prospect-card";
import { cn } from "@/lib/utils";
import type { Prospect, ProspectStatus } from "@/types/models";

const COLUMNS: { value: ProspectStatus; label: string }[] = [
  { value: "TO_CONTACT", label: "À contacter" },
  { value: "CONTACTED", label: "Contacté" },
  { value: "IN_DISCUSSION", label: "En discussion" },
  { value: "WON", label: "Gagné" },
  { value: "LOST", label: "Perdu" },
];

export function ProspectBoard({
  prospects,
  onChanged,
}: {
  prospects: Prospect[];
  onChanged: () => void;
}) {
  const [dragOverColumn, setDragOverColumn] = useState<ProspectStatus | null>(null);

  const moveProspect = async (prospectId: string, status: ProspectStatus) => {
    await fetch(`/api/prospects/${prospectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    onChanged();
  };

  const handleDrop = (status: ProspectStatus) => (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverColumn(null);
    const prospectId = e.dataTransfer.getData("text/prospect-id");
    const prospect = prospects.find((p) => p.id === prospectId);
    if (prospectId && prospect && prospect.status !== status) {
      moveProspect(prospectId, status);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
      {COLUMNS.map((column) => {
        const columnProspects = prospects.filter((p) => p.status === column.value);
        return (
          <div
            key={column.value}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverColumn(column.value);
            }}
            onDragLeave={() => setDragOverColumn((c) => (c === column.value ? null : c))}
            onDrop={handleDrop(column.value)}
            className={cn(
              "flex min-h-40 flex-col gap-3 rounded-lg border bg-muted/30 p-3 transition-colors",
              dragOverColumn === column.value && "border-primary bg-primary/5"
            )}
          >
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-medium">{column.label}</h3>
              <span className="text-xs text-muted-foreground">{columnProspects.length}</span>
            </div>
            {columnProspects.length === 0 && (
              <p className="px-1 text-xs text-muted-foreground">Aucun prospect</p>
            )}
            {columnProspects.map((prospect) => (
              <div
                key={prospect.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/prospect-id", prospect.id);
                  e.dataTransfer.effectAllowed = "move";
                }}
                className="cursor-grab active:cursor-grabbing"
              >
                <ProspectCard prospect={prospect} onChanged={onChanged} />
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
