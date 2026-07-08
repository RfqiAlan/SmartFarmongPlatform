import { Hero, Features } from "@/components/landing/Hero";

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--bg-primary)]">
      <Hero />
      <Features />
      
      <footer className="py-8 text-center border-t border-[var(--bg-glass-border)] text-[var(--text-muted)] text-sm">
        <p>&copy; 2026 Smart AWD AI. All rights reserved.</p>
      </footer>
    </main>
  );
}
