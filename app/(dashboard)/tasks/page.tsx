"use client";

import { useEffect, useState } from "react";
import { TaskForm } from "@/components/tasks/task-form";
import { TaskBoard } from "@/components/tasks/task-board";
import type { Task } from "@/types/models";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/tasks")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setTasks(data.tasks ?? []);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const load = () => setReloadKey((k) => k + 1);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tâches</h1>
          <p className="text-sm text-muted-foreground">
            Glissez-déposez vos tâches entre les colonnes pour changer leur statut.
          </p>
        </div>
        <TaskForm onCreated={load} />
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground">Chargement...</p>
      ) : (
        <TaskBoard tasks={tasks} onChanged={load} />
      )}
    </div>
  );
}
