import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import type { ChatMessage as ChatMessageType } from "@/types/models";

export function ChatMessage({ message }: { message: ChatMessageType }) {
  const isUser = message.role === "USER";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[75%] rounded-lg px-3 py-2 text-sm",
          isUser ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ ...props }) => <p className="mb-2 last:mb-0" {...props} />,
              ul: ({ ...props }) => (
                <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0" {...props} />
              ),
              ol: ({ ...props }) => (
                <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0" {...props} />
              ),
              li: ({ ...props }) => <li {...props} />,
              strong: ({ ...props }) => <strong className="font-semibold" {...props} />,
              a: ({ ...props }) => (
                <a className="underline underline-offset-2" target="_blank" rel="noreferrer" {...props} />
              ),
              code: ({ ...props }) => (
                <code className="rounded bg-black/10 px-1 py-0.5 font-mono text-xs" {...props} />
              ),
              pre: ({ ...props }) => (
                <pre className="mb-2 overflow-x-auto rounded bg-black/10 p-2 font-mono text-xs last:mb-0" {...props} />
              ),
              h1: ({ ...props }) => <h1 className="mb-2 text-base font-semibold" {...props} />,
              h2: ({ ...props }) => <h2 className="mb-2 text-base font-semibold" {...props} />,
              h3: ({ ...props }) => <h3 className="mb-2 text-sm font-semibold" {...props} />,
            }}
          >
            {message.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}
