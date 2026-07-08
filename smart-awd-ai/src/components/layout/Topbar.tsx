"use client";

import { useEffect, useState } from "react";
import { Bell, Clock, Menu } from "lucide-react";

interface TopbarProps {
  onOpenSidebar: () => void;
}

export function Topbar({ onOpenSidebar }: TopbarProps) {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 border-b border-[var(--bg-glass-border)] bg-[var(--bg-primary)]/80 backdrop-blur-md sticky top-0 z-30 flex justify-between items-center px-4 md:px-8">
      <div className="flex items-center gap-3">
        <button 
          onClick={onOpenSidebar}
          className="md:hidden p-2 -ml-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-glass)] hover:text-[var(--text-primary)] transition-colors"
        >
          <Menu size={24} />
        </button>
        <h2 className="text-lg md:text-xl font-semibold text-[var(--text-primary)]">Dashboard</h2>
      </div>
      
      <div className="flex items-center gap-4">
        {currentTime && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-glass)] border border-[var(--bg-glass-border)] text-blue-400">
            <Clock size={14} />
            <span className="text-sm font-mono font-bold">
              {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        )}
      
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-glass)] border border-[var(--bg-glass-border)]">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-xs text-[var(--text-secondary)]">System Online</span>
        </div>
        
        <button className="p-2 rounded-full hover:bg-[var(--bg-glass)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border border-[var(--bg-primary)]"></span>
        </button>
      </div>
    </header>
  );
}
