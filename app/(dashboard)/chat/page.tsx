"use client";

import { useEffect, useState } from "react";
import { ChatWindow } from "@/components/chat/chat-window";
import { ConversationList } from "@/components/chat/conversation-list";
import { PaidFeatureGate } from "@/components/billing/paid-feature-gate";
import type { ChatConversation } from "@/types/models";

export default function ChatPage() {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/chat/conversations")
      .then((res) => res.json())
      .then(async (data) => {
        if (cancelled) return;
        const list: ChatConversation[] = data.conversations ?? [];
        if (list.length === 0) {
          const created = await fetch("/api/chat/conversations", { method: "POST" }).then((r) =>
            r.json()
          );
          if (cancelled) return;
          setConversations([created.conversation]);
          setActiveId(created.conversation.id);
        } else {
          setConversations(list);
          setActiveId((current) => current ?? list[0].id);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const refreshList = () => setReloadKey((k) => k + 1);

  const handleNew = async () => {
    const data = await fetch("/api/chat/conversations", { method: "POST" }).then((r) => r.json());
    setConversations((prev) => [data.conversation, ...prev]);
    setActiveId(data.conversation.id);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/chat/${id}`, { method: "DELETE" });
    setConversations((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (activeId === id) {
        setActiveId(next[0]?.id ?? null);
      }
      return next;
    });
  };

  return (
    <PaidFeatureGate feature="L'Assistant IA">
      <div className="mx-auto max-w-5xl space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Assistant IA</h1>
          <p className="text-sm text-muted-foreground">
            Discutez avec MIA pour organiser votre travail.
          </p>
        </div>
        <div className="flex gap-4">
          <ConversationList
            conversations={conversations}
            activeId={activeId}
            onSelect={setActiveId}
            onNew={handleNew}
            onDelete={handleDelete}
          />
          <div className="flex-1">
            {activeId && <ChatWindow key={activeId} conversationId={activeId} onMessageSent={refreshList} />}
          </div>
        </div>
      </div>
    </PaidFeatureGate>
  );
}
