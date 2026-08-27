import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles } from "lucide-react";
import { useChatStore } from "@/store/chatStore";
import ChatMessage from "./ChatMessage";
import TypingIndicator from "./TypingIndicator";

const STARTERS = [
  "What is the biological function of this protein?",
  "Summarise its disease associations and known drugs.",
  "Which interaction partners matter most and why?",
  "Suggest experiments to probe its mechanism.",
];

const ChatInterface = () => {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { messages, isSending, isLoadingChat, sendMessage, activeProtein } = useChatStore();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isSending]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isSending) return;
    setInput("");
    await sendMessage(text);
  };

  const empty = messages.length === 0 && !isLoadingChat;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
        {empty ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mb-5">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold mb-2">
              {activeProtein ? `Ask about ${activeProtein.gene || activeProtein.name}` : "Smart Bio GPT"}
            </h2>
            <p className="text-muted-foreground mb-8">
              {activeProtein
                ? `${activeProtein.name} · ${activeProtein.organism}. Every answer is grounded in its live dossier.`
                : "Search a gene or protein above, then ask research questions with the structure held in context."}
            </p>

            {activeProtein && (
              <div className="grid sm:grid-cols-2 gap-2 w-full">
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    className="text-left text-sm px-4 py-3 rounded-xl border border-border hover:border-brand hover:bg-brand-soft transition-all duration-200"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-5">
            <AnimatePresence mode="popLayout">
              {messages.map((m) => (
                <ChatMessage key={m.id} message={m} />
              ))}
            </AnimatePresence>

            {isSending && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                <div className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="chat-bubble-ai">
                  <TypingIndicator />
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border bg-background">
        <form onSubmit={handleSubmit} className="relative max-w-3xl mx-auto">
          {activeProtein && (
            <div className="absolute -top-7 left-1 text-[11px] text-muted-foreground">
              context: <span className="font-medium text-foreground">{activeProtein.gene || activeProtein.accession}</span>
            </div>
          )}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={activeProtein ? `Ask about ${activeProtein.gene || activeProtein.name}…` : "Ask anything about proteins…"}
            className="w-full pl-4 pr-12 py-3.5 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-brand transition-all"
            disabled={isSending}
          />
          <button
            type="submit"
            disabled={!input.trim() || isSending}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            aria-label="Send"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
