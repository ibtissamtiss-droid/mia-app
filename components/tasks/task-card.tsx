"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import type { Task, TaskStatus } from "@/types/models";

const PRIORITY_LABEL: Record<Task["priority"], string> = {
  LOW: "Basse",
  MEDIUM: "Moyenne",
  HIGH: "Haute",
};

const PRIORITY_VARIANT: Record<Task["priority"], "secondary" | "default" | "destructive"> = {
  LOW: "secondary",
  MEDIUM: "default",
  HIGH: "destructive",
};

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "TODO", label: "À faire" },
  { value: "IN_PROGRESS", label: "En cours" },
  { value: "DONE", label: "Terminée" },
];

export function TaskCard({
  task,
  onChanged,
}: {
  task: Task;
  onChanged: () => void;
}) {
  const cycleStatus = async () => {
    const currentIndex = STATUS_OPTIONS.findIndex((s) => s.value === task.status);
    const next = STATUS_OPTIONS[(currentIndex + 1) % STATUS_OPTIONS.length];
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next.value }),
    });
    onChanged();
  };

  const remove = async () => {
    await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
    onChanged();
  };

  return (
    <Card>
      <CardContent className="space-y-2 py-3">
        <div className="flex items-start justify-between gap-2">
          <p className={task.status === "DONE" ? "line-through text-muted-foreground" : "text-sm font-medium"}>
            {task.title}
          </p>
          <Button variant="ghost" size="icon" className="-mr-1 -mt-1 h-6 w-6 shrink-0" onClick={remove}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
        {task.description && (
          <p className="text-xs text-muted-foreground">{task.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={PRIORITY_VARIANT[task.priority]}>{PRIORITY_LABEL[task.priority]}</Badge>
          {task.dueDate && (
            <span className="text-xs text-muted-foreground">
              {new Date(task.dueDate).toLocaleDateString("fr-FR")}
            </span>
          )}
        </div>
        <Button variant="outline" size="sm" className="w-full" onClick={cycleStatus}>
          {STATUS_OPTIONS.find((s) => s.value === task.status)?.label}
        </Button>
      </CardContent>
    </Card>
  );
}
