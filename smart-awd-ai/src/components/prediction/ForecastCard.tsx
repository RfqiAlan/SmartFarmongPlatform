"use client";

import { useEffect, useState } from "react";
import { fetchWeatherForecast, WeatherForecast } from "@/utils/weatherApi";
import { Cloud, Sun, CloudRain, CloudLightning, CloudSnow, CalendarDays, Droplets, Thermometer, Sunrise, Sunset, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function ForecastCard({ device }: { device: any }) {
  const [forecasts, setForecasts] = useState<WeatherForecast[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadForecast() {
      if (!device?.lat || !device?.lng) {
        setLoading(false);
        return;
      }
      setLoading(true);
      
      try {
        const data = await fetchWeatherForecast(device.lat, device.lng);
        setForecasts(data);
      } catch (err) {
        console.error("Failed to load forecast data:", err);
      } finally {
        setLoading(false);
      }
    }
    
    loadForecast();
  }, [device]);

  // Helper to map WMO weather code to icon
  const getWeatherIcon = (code: number, size: number = 24) => {
    if (code === 0) return <Sun size={size} className="text-yellow-600 dark:text-yellow-400" />;
    if (code >= 1 && code <= 3) return <Cloud size={size} className="text-gray-500 dark:text-gray-300" />;
    if (code === 45 || code === 48) return <Cloud size={size} className="text-gray-600 dark:text-gray-400" />;
    if (code >= 51 && code <= 67) return <CloudRain size={size} className="text-blue-600 dark:text-blue-400" />;
    if (code >= 80 && code <= 82) return <CloudRain size={size} className="text-blue-700 dark:text-blue-500" />;
    if (code >= 95 && code <= 99) return <CloudLightning size={size} className="text-yellow-600 dark:text-yellow-500" />;
    if (code >= 71 && code <= 77) return <CloudSnow size={size} className="text-slate-600 dark:text-white" />;
    
    // Default
    return <Cloud size={size} className="text-gray-600 dark:text-gray-400" />;
  };

  const getAgriRecommendation = (code: number, precip: number) => {
    if (precip >= 20 || (code >= 80 && code <= 99)) {
      return {
        title: "Waspada Banjir",
        desc: `Hujan lebat (${precip}mm)! Buka saluran pembuangan air sawah.`,
        color: "text-red-700 dark:text-red-400",
        bg: "bg-red-500/10 border-red-500/20",
        icon: <AlertTriangle size={14} className="mr-1 shrink-0" />
      };
    }
    if (precip >= 5 && precip < 20) {
      return {
        title: "Hujan Sedang",
        desc: `Air sawah akan bertambah (${precip}mm). Tunda pemupukan.`,
        color: "text-amber-700 dark:text-amber-500",
        bg: "bg-amber-500/10 border-amber-500/20",
        icon: <Droplets size={14} className="mr-1 shrink-0" />
      };
    }
    if (precip > 0 && precip < 5) {
      return {
        title: "Gerimis",
        desc: "Hujan ringan, aman untuk tanaman padi.",
        color: "text-blue-700 dark:text-blue-400",
        bg: "bg-blue-500/10 border-blue-500/20",
        icon: <CloudRain size={14} className="mr-1 shrink-0" />
      };
    }
    if (code === 0 || (code >= 1 && code <= 3)) {
      return {
        title: "Sangat Bagus",
        desc: "Cuaca cerah, sangat cocok untuk menjemur padi/gabah.",
        color: "text-green-700 dark:text-green-500",
        bg: "bg-green-500/10 border-green-500/20",
        icon: <CheckCircle2 size={14} className="mr-1 shrink-0" />
      };
    }
    return {
      title: "Mendung / Teduh",
      desc: "Penjemuran mungkin kurang optimal hari ini.",
      color: "text-slate-700 dark:text-slate-400",
      bg: "bg-slate-500/10 border-slate-500/20",
      icon: <Cloud size={14} className="mr-1 shrink-0" />
    };
  };

  if (!device?.lat || !device?.lng) {
    return null; // Don't render if no location
  }

  if (loading) {
    return (
      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--bg-glass-border)] p-6 animate-shimmer h-full">
        <div className="h-6 w-48 bg-[var(--bg-glass)] rounded mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-[var(--bg-glass)] rounded-2xl h-64"></div>
           <div className="bg-[var(--bg-glass)] rounded-2xl h-64"></div>
           <div className="bg-[var(--bg-glass)] rounded-2xl h-64"></div>
        </div>
      </div>
    );
  }

  if (forecasts.length === 0) {
    return null;
  }

  return (
    <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--bg-glass-border)] p-6 h-full flex flex-col justify-between">
      <h3 className="text-lg font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2">
        <CalendarDays size={20} className="text-blue-500" /> Info Cuaca Pertanian (3 Hari)
      </h3>
      
      {/* 3-Column Grid for Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {forecasts.map((f, i) => {
          const dateObj = new Date(f.date);
          const dateStr = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
          const dayName = i === 0 ? "Hari Ini" : i === 1 ? "Besok" : dateObj.toLocaleDateString('id-ID', { weekday: 'long' });
          const rec = getAgriRecommendation(f.weathercode, f.precipitation_sum);
          
          return (
             <div key={i} className="flex flex-col p-5 bg-[var(--bg-glass)] rounded-2xl border border-[var(--bg-glass-border)] hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
               {/* Header: Day & Icon */}
               <div className="flex justify-between items-center mb-5 border-b border-[var(--bg-glass-border)] pb-4">
                 <div>
                   <h4 className="font-bold text-lg text-[var(--text-primary)] tracking-wide capitalize">{dayName}</h4>
                   <p className="text-xs text-[var(--text-muted)] mt-0.5">{dateStr}</p>
                 </div>
                 <div className="w-14 h-14 bg-gradient-to-br from-[var(--bg-primary)] to-[var(--bg-glass)] rounded-xl flex items-center justify-center border border-[var(--bg-glass-border)] shadow-inner shrink-0">
                   {getWeatherIcon(f.weathercode, 32)}
                 </div>
               </div>
               
               {/* Advanced Metrics (Grid 2x2) */}
               <div className="grid grid-cols-2 gap-y-4 gap-x-2 mb-6">
                  {/* Suhu */}
                  <div className="flex flex-col bg-[var(--bg-primary)] p-2.5 rounded-lg border border-[var(--bg-glass-border)]">
                    <span className="flex items-center gap-1.5 text-[var(--text-muted)] text-[10px] uppercase font-bold tracking-wider mb-1">
                      <Thermometer size={12} /> Suhu
                    </span>
                    <span className="font-mono font-bold text-sm text-[var(--text-primary)]">
                      {Math.round(f.temperature_min)}° - {Math.round(f.temperature_max)}°<span className="text-[10px] text-[var(--text-muted)] font-sans">C</span>
                    </span>
                  </div>
                  
                  {/* Curah Hujan */}
                  <div className="flex flex-col bg-[var(--bg-primary)] p-2.5 rounded-lg border border-[var(--bg-glass-border)]">
                    <span className="flex items-center gap-1.5 text-[var(--text-muted)] text-[10px] uppercase font-bold tracking-wider mb-1">
                      <Droplets size={12} className={f.precipitation_sum > 0 ? "text-blue-500" : ""} /> Curah Hujan
                    </span>
                    <span className="font-mono font-bold text-sm text-[var(--text-primary)]">
                      {f.precipitation_sum} <span className="text-[10px] text-[var(--text-muted)] font-sans">mm</span>
                    </span>
                  </div>

                  {/* Sinar Matahari */}
                  <div className="flex flex-col bg-[var(--bg-primary)] p-2.5 rounded-lg border border-[var(--bg-glass-border)]">
                    <span className="flex items-center gap-1.5 text-[var(--text-muted)] text-[10px] uppercase font-bold tracking-wider mb-1">
                      <Sun size={12} className="text-amber-500" /> Penyinaran
                    </span>
                    <span className="font-mono font-bold text-sm text-[var(--text-primary)]">
                      {(f.sunshine_duration / 3600).toFixed(1)} <span className="text-[10px] text-[var(--text-muted)] font-sans">jam</span>
                    </span>
                  </div>
                  
                  {/* Sunrise / Sunset */}
                  <div className="flex flex-col bg-[var(--bg-primary)] p-2.5 rounded-lg border border-[var(--bg-glass-border)]">
                    <span className="flex items-center gap-1.5 text-[var(--text-muted)] text-[10px] uppercase font-bold tracking-wider mb-1">
                      <Sunrise size={12} className="text-orange-500" /> Matahari
                    </span>
                    <div className="flex flex-col gap-0.5 font-mono font-bold text-[11px] text-[var(--text-primary)]">
                      <span className="flex items-center gap-1"><Sunrise size={10} className="text-[var(--text-muted)]"/> {new Date(f.sunrise).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="flex items-center gap-1"><Sunset size={10} className="text-[var(--text-muted)]"/> {new Date(f.sunset).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
               </div>
               
               {/* Recommendation Box */}
               <div className={`mt-auto p-4 rounded-xl border ${rec.bg} flex flex-col gap-1.5`}>
                 <div className={`text-sm font-bold flex items-center ${rec.color}`}>
                   {rec.icon} <span>{rec.title}</span>
                 </div>
                 <div className="text-xs text-[var(--text-secondary)] leading-relaxed">
                   {rec.desc}
                 </div>
               </div>
             </div>
          );
        })}
      </div>
    </div>
  );
}
