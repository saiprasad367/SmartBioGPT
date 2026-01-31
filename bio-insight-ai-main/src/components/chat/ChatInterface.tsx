import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles } from "lucide-react";
import { useChatStore } from "@/store/chatStore";
import ChatMessage from "./ChatMessage";
import TypingIndicator from "./TypingIndicator";
import { bio, chat } from "@/lib/api"; // Import API client
import { toast } from "sonner";

const ChatInterface = () => {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const {
    currentSessionId,
    isLoading,
    addMessage,
    setLoading,
    getCurrentSession,
    createSession,
    activeProteinId,
    activeProteinData
  } = useChatStore();

  const currentSession = getCurrentSession();

  // ... scrollToBottom ...

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    let sessionId = currentSessionId;
    if (!sessionId) {
      sessionId = createSession(); // createSession returns the new sessionId
    }

    const userMessage = input.trim();
    setInput("");

    // Add user message
    addMessage(sessionId, {
      role: "user",
      content: userMessage,
    });

    setLoading(true);

    try {
      // Use Global Context if available
      // If user typed a new protein in chat, we *could* update it, 
      // but user requested: "show related only until new protein is typed in search bar"
      // So we strictly use the Store's active protein.

      const pId = activeProteinId;
      const proteinContextData = activeProteinData;

      // 2. Send to AI Chat
      const chatRes = await chat.sendMessage({
        sessionId,
        message: userMessage,
        proteinContext: pId || undefined,
        contextData: proteinContextData // Always inject current active protein data
      });

      const aiMessage = chatRes.data.messages[chatRes.data.messages.length - 1];

      addMessage(sessionId!, {
        role: "assistant",
        content: aiMessage.content,
        // Only attach data card if it's the *first* time mentioning it? 
        // Or maybe just let the AI handle it.
        // For now, we won't attach the big card every time to keep chat clean,
        // unless it's a new search (which happens in Header).
        // But if we want to show it, we can. Active User request didn't specify,
        // but implied context awareness.
      });

    } catch (error: any) {
      toast.error("Failed to get response");
      addMessage(sessionId!, {
        role: "assistant",
        content: "I encountered an error connecting to the advanced bio-network. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const messages = currentSession?.messages || [];

  const suggestedQueries = [
    "TP53",
    "BRCA1",
    "EGFR",
  ];

  if (!currentSession && !isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
          <span className="text-3xl">🧬</span>
        </div>
        <h2 className="text-2xl font-bold">Smart Bio GPT</h2>
        <p className="text-muted-foreground max-w-md">
          Start a new research session by asking a question or searching for a protein above.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-full flex flex-col items-center justify-center text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-6 shadow-glow">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2 tracking-tight">Advanced Bio-Intelligence</h2>
            <p className="text-muted-foreground mb-8 max-w-md">
              Enter a protein ID (e.g., <strong>TP53</strong>) to analyze structure, function, and complex interactions via real-time OpenRouter & AlphaFold data.
            </p>

            <div className="flex flex-wrap justify-center gap-3">
              {suggestedQueries.map((query, index) => (
                <button
                  key={index}
                  onClick={() => setInput(query)}
                  className="px-4 py-2 rounded-full bg-secondary/50 border border-border/50 text-sm hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 shadow-sm"
                >
                  {query}
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            <AnimatePresence mode="popLayout">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
            </AnimatePresence>

            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="chat-bubble-ai inline-block"
              >
                <TypingIndicator />
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-background border-t border-border">
        <form
          onSubmit={handleSubmit}
          className="relative max-w-3xl mx-auto"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about proteins..."
            className="w-full pl-4 pr-12 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
