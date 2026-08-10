"use client";

import { useState } from "react";
import { TaskCard } from "@/components/tasks/task-card";
import { cn } from "@/lib/utils";
import type { Task, TaskStatus } from "@/types/models";

const COLUMNS: { value: TaskStatus; label: string }[] = [
  { value: "TODO", label: "À faire" },
  { value: "IN_PROGRESS", label: "En cours" },
  { value: "DONE", label: "Terminée" },
];

export function TaskBoard({ tasks, onChanged }: { tasks: Task[]; onChanged: () => void }) {
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  const moveTask = async (taskId: string, status: TaskStatus) => {
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    onChanged();
  };

  const handleDrop = (status: TaskStatus) => (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = e.dataTransfer.getData("text/task-id");
    const task = tasks.find((t) => t.id === taskId);
    if (taskId && task && task.status !== status) {
      moveTask(taskId, status);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {COLUMNS.map((column) => {
        const columnTasks = tasks.filter((t) => t.status === column.value);
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
              <span className="text-xs text-muted-foreground">{columnTasks.length}</span>
            </div>
            {columnTasks.length === 0 && (
              <p className="px-1 text-xs text-muted-foreground">Aucune tâche</p>
            )}
            {columnTasks.map((task) => (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/task-id", task.id);
                  e.dataTransfer.effectAllowed = "move";
                }}
                className="cursor-grab active:cursor-grabbing"
              >
                <TaskCard task={task} onChanged={onChanged} />
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
