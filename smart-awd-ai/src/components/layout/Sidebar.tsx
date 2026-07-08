"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BarChart3, Bot, Settings, Droplets, MapPin, Sun, Moon, X } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "AI Prediction", href: "/prediction", icon: Droplets },
  { name: "AI Assistant", href: "/assistant", icon: Bot },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by only rendering after mount
  useEffect(() => setMounted(true), []);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar Content */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 h-screen 
        border-r border-[var(--bg-glass-border)] bg-[var(--bg-secondary)] flex-col
        transition-transform duration-300 ease-in-out flex
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-[var(--bg-glass-border)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]">
              <MapPin size={18} />
            </div>
            <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              Smart AWD AI
            </span>
          </div>
          <button onClick={onClose} className="md:hidden p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <X size={20} />
          </button>
        </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive 
                  ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" 
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-glass)] hover:text-[var(--text-primary)]"
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium text-sm">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[var(--bg-glass-border)] space-y-4">
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-full flex items-center justify-between px-4 py-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-glass)] hover:text-[var(--text-primary)] border border-[var(--bg-glass-border)] transition-colors"
          >
            <span className="text-sm font-medium">{theme === "dark" ? "Mode Gelap" : "Mode Terang"}</span>
            {theme === "dark" ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        )}
        <div className="text-xs text-[var(--text-muted)] text-center">
          &copy; 2026 AI Agriculture
        </div>
      </div>
      </aside>
    </>
  );
}
