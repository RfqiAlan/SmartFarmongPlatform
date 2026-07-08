import Link from "next/link";
import { ArrowRight, Droplets, Cpu, LineChart } from "lucide-react";

export function Hero() {
  return (
    <div className="relative overflow-hidden min-h-screen flex items-center justify-center pt-20 pb-32">
      {/* Background Effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--bg-glass)] border border-[var(--bg-glass-border)] text-sm font-medium text-blue-400 mb-8 animate-fade-in-up">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          Smart AWD AI v1.0 is Live
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 animate-fade-in-up animation-delay-100">
          Smart Water Management <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-500">
            for Sustainable Agriculture
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-12 animate-fade-in-up animation-delay-200">
          Platform IoT berbasis AI untuk memonitor tinggi muka air sawah secara real-time, 
          memprediksi potensi kekeringan, dan memberikan rekomendasi irigasi cerdas.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up animation-delay-300">
          <Link 
            href="/dashboard"
            className="flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all hover:scale-105"
          >
            Buka Dashboard <ArrowRight size={18} />
          </Link>
          <a 
            href="#features"
            className="flex items-center gap-2 px-8 py-4 rounded-full bg-[var(--bg-glass)] border border-[var(--bg-glass-border)] hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)] font-medium transition-all"
          >
            Pelajari Lebih Lanjut
          </a>
        </div>
      </div>
    </div>
  );
}

export function Features() {
  const features = [
    {
      icon: <Droplets className="w-6 h-6 text-blue-400" />,
      title: "Real-time Monitoring",
      desc: "Pantau tinggi muka air (AWD) sawah Anda 24/7 menggunakan sensor ultrasonik berakurasi tinggi."
    },
    {
      icon: <Cpu className="w-6 h-6 text-purple-400" />,
      title: "AI Prediction Engine",
      desc: "Prediksi tingkat kekeringan 6, 12, dan 24 jam ke depan berdasarkan machine learning cerdas."
    },
    {
      icon: <LineChart className="w-6 h-6 text-cyan-400" />,
      title: "Data Analytics",
      desc: "Analisa historis tinggi air, performa baterai surya, dan kekuatan sinyal perangkat."
    }
  ];

  return (
    <section id="features" className="py-24 bg-[var(--bg-secondary)] border-t border-[var(--bg-glass-border)]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Fitur Utama</h2>
          <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
            Sistem yang dirancang untuk memastikan sawah Anda tidak pernah kekurangan air sekaligus menghemat penggunaan sumber daya.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <div key={i} className="p-8 rounded-2xl bg-[var(--bg-card)] border border-[var(--bg-glass-border)] hover:-translate-y-2 transition-transform duration-300">
              <div className="w-12 h-12 rounded-xl bg-[var(--bg-glass)] flex items-center justify-center mb-6 border border-[var(--bg-glass-border)]">
                {f.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3">{f.title}</h3>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
