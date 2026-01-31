import { motion } from "framer-motion";
import { Message, ProteinData } from "@/store/chatStore";
import { Box, Activity, Pill, AlertTriangle } from "lucide-react";

interface ChatMessageProps {
  message: Message;
}

const ProteinCard = ({ data }: { data: ProteinData }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 p-4 bg-secondary rounded-xl border border-border"
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Box className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-semibold">{data.name}</h4>
          <p className="text-sm text-muted-foreground">
            Gene: {data.gene} • {data.organism}
          </p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
        {data.function}
      </p>

      <div className="grid grid-cols-2 gap-4">
        {data.diseases?.length > 0 && (
          <div className="p-3 bg-background rounded-lg">
            <div className="flex items-center gap-2 mb-2 text-sm font-medium">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Disease Associations
            </div>
            <div className="flex flex-wrap gap-1">
              {data.diseases.map((disease, i) => (
                <span key={i} className="px-2 py-0.5 bg-amber-500/10 text-amber-700 text-xs rounded-full">
                  {disease}
                </span>
              ))}
            </div>
          </div>
        )}

        {data.drugs?.length > 0 && (
          <div className="p-3 bg-background rounded-lg">
            <div className="flex items-center gap-2 mb-2 text-sm font-medium">
              <Pill className="w-4 h-4 text-blue-500" />
              Drug Interactions
            </div>
            <div className="flex flex-wrap gap-1">
              {data.drugs.map((drug, i) => (
                <span key={i} className="px-2 py-0.5 bg-blue-500/10 text-blue-700 text-xs rounded-full">
                  {drug}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

import { forwardRef } from "react";

// ... imports

// ... ProteinCard component

const ChatMessage = forwardRef<HTMLDivElement, ChatMessageProps>(({ message }, ref) => {
  const isUser = message.role === "user";

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div className={`max-w-[80%] ${isUser ? "order-2" : ""}`}>
        <div className={isUser ? "chat-bubble-user" : "chat-bubble-ai"}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>

        {message.proteinData && <ProteinCard data={message.proteinData} />}

        <p className={`text-xs text-muted-foreground mt-2 ${isUser ? "text-right" : ""}`}>
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
          })}
        </p>
      </div>
    </motion.div>
  );
});

ChatMessage.displayName = "ChatMessage";

export default ChatMessage;
