"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, User, Loader2 } from "lucide-react";

interface Message {
  role: "user" | "model";
  content: string;
}

interface AiAssistantProps {
  deviceDataContext: string;
}

export default function AiAssistant({ deviceDataContext }: AiAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "model", content: "Halo! Saya adalah Asisten AI untuk sawah Anda. Ada yang bisa saya bantu terkait kondisi air hari ini?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Helper to render simple markdown like **bold**
  const renderMessageContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, i) => {
      // Split by bold syntax
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const renderedParts = parts.map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={j} className="font-bold">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      return (
        <span key={i}>
          {renderedParts}
          {i !== lines.length - 1 && <br />}
        </span>
      );
    });
  };

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput("");
    
    // Add user message to UI immediately
    const newMessages: Message[] = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          context: deviceDataContext
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessages(prev => [...prev, { role: "model", content: data.reply }]);
      } else {
        setMessages(prev => [...prev, { 
          role: "model", 
          content: `Maaf, terjadi kesalahan: ${data.error || 'Server error'}`
        }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: "model", 
        content: "Maaf, gagal terhubung ke server. Silakan coba lagi nanti."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-500/30 hover:bg-blue-500 transition-all z-40 transform hover:scale-105 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
      >
        <MessageSquare size={24} />
      </button>

      {/* Chat Window */}
      <div 
        className={`fixed bottom-6 right-6 w-full max-w-sm h-[500px] max-h-[80vh] bg-[var(--bg-card)] border border-[var(--bg-glass-border)] rounded-2xl shadow-2xl flex flex-col z-50 transition-all transform origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--bg-glass-border)] bg-blue-600/10 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <Bot size={20} />
            </div>
            <div>
              <h3 className="font-bold text-[var(--text-primary)] text-sm">Smart AWD AI</h3>
              <p className="text-[10px] text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Online
              </p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-glass)] hover:text-[var(--text-primary)] rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'model' && (
                <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center shrink-0 border border-blue-500/30">
                  <Bot size={14} className="text-blue-600 dark:text-blue-400" />
                </div>
              )}
              
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-sm' 
                  : 'bg-[var(--bg-glass)] border border-[var(--bg-glass-border)] text-[var(--text-primary)] rounded-bl-sm'
              }`}>
                {renderMessageContent(msg.content)}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-[var(--bg-primary)] flex items-center justify-center shrink-0 border border-[var(--bg-glass-border)]">
                  <User size={14} className="text-[var(--text-secondary)]" />
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center shrink-0 border border-blue-500/30">
                <Bot size={14} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div className="max-w-[80%] rounded-2xl rounded-bl-sm px-4 py-2.5 bg-[var(--bg-glass)] border border-[var(--bg-glass-border)] text-[var(--text-secondary)] flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" /> Mengetik...
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={sendMessage} className="p-3 border-t border-[var(--bg-glass-border)] bg-[var(--bg-card)] rounded-b-2xl flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tanya sesuatu..."
            className="flex-1 bg-[var(--bg-glass)] border border-[var(--bg-glass-border)] rounded-full px-4 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-blue-500 transition-colors"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 bg-blue-600 hover:bg-blue-500 text-white rounded-full flex items-center justify-center shrink-0 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={16} className="ml-1" />
          </button>
        </form>
      </div>
    </>
  );
}
