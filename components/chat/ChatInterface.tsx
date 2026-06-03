"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  id: string;
  role: "user" | "bot";
  content: string;
}

// Simple markdown formatter
function FormattedText({ text }: { text: string }) {
  // split by newlines
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, i) => {
        if (line.trim() === "") return <br key={i} />;
        
        // Match **bold**, *italic*, `code`
        // We do this by splitting the string with a regex that captures these patterns
        const parts = line.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
        
        return (
          <p key={i} className="mb-1 last:mb-0">
            {parts.map((part, j) => {
              if (part.startsWith("**") && part.endsWith("**")) {
                return <strong key={j} className="font-bold">{part.slice(2, -2)}</strong>;
              }
              if (part.startsWith("*") && part.endsWith("*")) {
                return <em key={j} className="italic">{part.slice(1, -1)}</em>;
              }
              if (part.startsWith("`") && part.endsWith("`")) {
                return (
                  <code key={j} className="bg-black/10 dark:bg-white/10 rounded px-1 py-0.5 text-xs font-mono">
                    {part.slice(1, -1)}
                  </code>
                );
              }
              return part;
            })}
          </p>
        );
      })}
    </>
  );
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "bot",
      content: "👋 Halo! Saya **TaskChat AI Bot**.\n\nSaya bisa membantu kamu mengelola tugas kuliah langsung di sini. Ketik pesan seperti:\n*\"Tugas Fisika membuat resume bab 2 deadline senin depan\"*\natau ketik **/help** untuk melihat daftar perintah."
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput("");
    
    // Add user message
    const newMsg: Message = { id: Date.now().toString(), role: "user", content: userMsg };
    setMessages((prev) => [...prev, newMsg]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: userMsg }),
      });

      const data = await res.json();
      
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        content: data.response || "❌ Terjadi kesalahan saat menghubungi server."
      };
      
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev, 
        { id: (Date.now() + 1).toString(), role: "bot", content: "❌ Gagal terhubung ke server. Periksa koneksi internetmu." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] max-h-[70vh] bg-white dark:bg-[var(--card)] border border-[#f0eef8] dark:border-[var(--card-border)] rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#f0eef8] dark:border-[var(--card-border)] bg-[#f8f7ff] dark:bg-[var(--card-border)]/20 flex items-center gap-3">
        <div className="w-10 h-10 bg-[#eef2ff] dark:bg-[#1e1b4b] rounded-full flex items-center justify-center shrink-0">
          <i className="fa-solid fa-robot text-[#6366f1] text-lg"></i>
        </div>
        <div>
          <h3 className="font-bold text-[#1a1a2e] dark:text-white leading-tight">TaskChat AI</h3>
          <p className="text-[10px] text-[#22c55e] font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse"></span>
            Online
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div 
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-3.5 text-sm ${
                msg.role === "user" 
                  ? "bg-[#6366f1] text-white rounded-tr-sm" 
                  : "bg-[#f8f7ff] dark:bg-[var(--card-border)]/30 text-[#1a1a2e] dark:text-[#d1d5db] rounded-tl-sm border border-[#f0eef8] dark:border-[var(--card-border)]"
              }`}
            >
              <FormattedText text={msg.content} />
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[#f8f7ff] dark:bg-[var(--card-border)]/30 border border-[#f0eef8] dark:border-[var(--card-border)] rounded-2xl rounded-tl-sm px-5 py-4 flex gap-1.5 items-center">
              <span className="w-2 h-2 rounded-full bg-[#6366f1]/60 animate-bounce" style={{ animationDelay: "0ms" }}></span>
              <span className="w-2 h-2 rounded-full bg-[#6366f1]/60 animate-bounce" style={{ animationDelay: "150ms" }}></span>
              <span className="w-2 h-2 rounded-full bg-[#6366f1]/60 animate-bounce" style={{ animationDelay: "300ms" }}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white dark:bg-[var(--card)] border-t border-[#f0eef8] dark:border-[var(--card-border)]">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ketik pesan atau /help..."
            className="flex-1 bg-[#f8f7ff] dark:bg-[var(--background)] border border-[#e0dff8] dark:border-[var(--card-border)] text-[#1a1a2e] dark:text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 transition-all placeholder:text-[#9ca3af]"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="w-11 h-11 bg-[#6366f1] text-white rounded-xl flex items-center justify-center shrink-0 hover:bg-[#4f46e5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="fa-solid fa-paper-plane text-sm"></i>
          </button>
        </form>
      </div>
    </div>
  );
}
