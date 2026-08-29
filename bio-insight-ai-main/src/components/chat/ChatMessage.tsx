import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Sparkles, User as UserIcon } from "lucide-react";
import type { ChatMessageDTO } from "@/lib/api";

interface Props {
  message: ChatMessageDTO & { pending?: boolean; error?: boolean };
}

const ChatMessage = ({ message }: Props) => {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
      )}

      <div className={`max-w-[85%] sm:max-w-[75%] ${isUser ? "order-2" : ""}`}>
        <div className={isUser ? "chat-bubble-user" : "chat-bubble-ai"}>
          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose-chat">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        <div
          className={`mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground ${
            isUser ? "justify-end" : ""
          }`}
        >
          {message.degraded && !isUser && (
            <span className="px-1.5 py-0.5 rounded bg-warning/10 text-warning font-medium">
              offline answer
            </span>
          )}
          <span>
            {new Date(message.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>

      {isUser && (
        <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-0.5 order-3">
          <UserIcon className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      )}
    </motion.div>
  );
};

export default ChatMessage;
