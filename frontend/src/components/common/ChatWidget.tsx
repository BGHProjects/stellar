import { modalOverlay } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const GATEWAY_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";
const MOCK_MODE = import.meta.env.VITE_MOCK_MODE === "true";

const MOCK_RESPONSES = [
  "I'm the Stellar voyage assistant. In the full deployment I can answer questions about routes, orbital windows, journey durations, and help you find the best time to travel anywhere in the Taunor system.",
  "For example, I could tell you the current distance between Aethon and Calyx, find the next 5-star orbital window for a specific route, or explain the difference between Gravity Assist and Scenic routes.",
  "The chatbot is powered by Claude with live orbital calculation tools — it can run real-time calculations from system.json to answer questions about the system.",
];

const SUGGESTED_QUESTIONS = [
  "What's the best time to fly from Aethon to Calyx?",
  "How long does it take to reach Kalos?",
  "Does Mira require a permit?",
  "What's the difference between Full Cryo and Cryo Intervals?",
  "Which ship class is fastest?",
];

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello — I'm your Stellar voyage assistant. I can answer questions about routes, orbital windows, journey times, destinations, and anything else about the Taunor system. What would you like to know?",
    },
  ]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mockIndex = useRef(0);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  // Focus input when widget opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const userMessage: Message = { role: "user", content };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    if (MOCK_MODE) {
      // Return a mock response in mock mode
      await new Promise((r) => setTimeout(r, 800));
      const reply = MOCK_RESPONSES[mockIndex.current % MOCK_RESPONSES.length];
      mockIndex.current++;
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      setLoading(false);
      return;
    }

    try {
      // Build conversation history for the API (exclude the welcome message)
      const history = newMessages.slice(1, -1).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch(`${GATEWAY_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("stellar_access_token") ?? ""}`,
        },
        body: JSON.stringify({
          message: content,
          conversationHistory: history,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I couldn't reach the AI service right now. Make sure the gateway and AI service are both running.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Makes text between **s be purple
  const formatResponse = (text: string) => {
    const parts = text.split(/\*\*(.+?)\*\*/g);
    return parts.map((part, i) =>
      i % 2 === 1 ? (
        <span key={i} className="text-accent-400">
          {part}
        </span>
      ) : (
        part
      ),
    );
  };

  return (
    <>
      {/* Floating trigger button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="trigger"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-accent-600 hover:bg-accent-500 flex items-center justify-center shadow-glow-accent transition-colors duration-200 group"
            aria-label="Open voyage assistant"
          >
            <motion.div
              whileHover={{ rotate: 15 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <img
                src="/images/logo.png"
                alt="Stellar Logo"
                className="w-5 h-5"
              />
            </motion.div>
            {/* Tooltip */}
            <span className="absolute right-16 bg-black/90 text-white text-xs font-sans px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-white/10">
              Voyage Assistant
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <>
            {/* Overlay (mobile) */}
            <motion.div
              variants={modalOverlay}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 sm:hidden"
              onClick={() => setOpen(false)}
            />

            {/* Chat panel */}
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.9,
                y: 20,
                transformOrigin: "bottom right",
              }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={cn(
                "fixed z-50 flex flex-col overflow-hidden",
                "bottom-6 right-6",
                // Mobile: take most of the screen
                "left-4 top-20",
                // Desktop: fixed size panel
                "sm:left-auto sm:top-auto sm:w-[420px] sm:h-[580px]",
                "glass-card border border-white/10 rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.7)]",
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent-600/30 border border-accent-500/40 flex items-center justify-center">
                    <img
                      src="/images/logo.png"
                      alt="Stellar Logo"
                      className="w-4 h-4"
                    />
                  </div>
                  <div>
                    <p className="font-display text-sm text-white">
                      Voyage Assistant
                    </p>
                    <p className="font-sans text-xs text-white/35">
                      Powered by Claude
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="text-white/30 hover:text-white transition-colors rounded-lg p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 scrollbar-none">
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className={cn(
                      "flex",
                      msg.role === "user" ? "justify-end" : "justify-start",
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-4 py-2.5 font-sans text-sm leading-relaxed",
                        msg.role === "user"
                          ? "bg-accent-600 text-white rounded-br-sm"
                          : "bg-surface-800/80 text-white/80 border border-white/6 rounded-bl-sm",
                      )}
                    >
                      {formatResponse(msg.content)}
                    </div>
                  </motion.div>
                ))}

                {loading && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="bg-surface-800/80 border border-white/6 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 text-accent-400 animate-spin" />
                      <span className="font-sans text-xs text-white/40">
                        Thinking…
                      </span>
                    </div>
                  </motion.div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* Suggested questions — show when only welcome message */}
              {messages.length === 1 && (
                <div className="px-4 pb-2 flex flex-col gap-1.5 shrink-0">
                  <p className="font-sans text-[10px] text-white/25 uppercase tracking-widest px-1">
                    Try asking
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTED_QUESTIONS.slice(0, 3).map((q) => (
                      <button
                        key={q}
                        onClick={() => sendMessage(q)}
                        className="font-sans text-xs text-accent-300 bg-accent-600/10 border border-accent-600/20 hover:border-accent-600/40 hover:bg-accent-600/20 px-2.5 py-1.5 rounded-lg transition-all text-left"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="px-4 py-3 border-t border-white/8 shrink-0">
                <div className="flex items-center gap-2 bg-surface-900/80 border border-white/8 hover:border-accent-600/30 rounded-xl px-4 py-2.5 transition-colors focus-within:border-accent-600/40">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask anything about the Taunor system…"
                    disabled={loading}
                    className="flex-1 bg-transparent font-sans text-sm text-white placeholder-white/25 outline-none disabled:opacity-50"
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || loading}
                    className="text-accent-400 hover:text-accent-300 disabled:text-white/20 transition-colors shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                {MOCK_MODE && (
                  <p className="font-sans text-[10px] text-white/20 text-center mt-2">
                    Mock mode — responses are simulated
                  </p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
