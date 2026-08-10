"use client";

import { TaskCard } from "@/components/tasks/task-card";
import type { Task } from "@/types/models";

export function TaskList({ tasks, onChanged }: { tasks: Task[]; onChanged: () => void }) {
  if (tasks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucune tâche pour le moment. Créez-en une pour commencer.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} onChanged={onChanged} />
      ))}
    </div>
  );
}
