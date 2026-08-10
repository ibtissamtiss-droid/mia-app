import { ChatWindow } from "@/components/chat/chat-window";

export default function ChatPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Assistant IA</h1>
        <p className="text-sm text-muted-foreground">
          Discutez avec MIA pour organiser votre travail.
        </p>
      </div>
      <ChatWindow />
    </div>
  );
}
