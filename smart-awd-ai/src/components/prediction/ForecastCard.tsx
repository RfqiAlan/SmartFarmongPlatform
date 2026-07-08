"use client";

import { useEffect, useState } from "react";
import { fetchWeatherForecast, WeatherForecast } from "@/utils/weatherApi";
import { Cloud, Sun, CloudRain, CloudLightning, CloudSnow, CalendarDays, Droplets, Thermometer, Wind, AlertTriangle, CheckCircle2 } from "lucide-react";

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
        icon: <AlertTriangle size={14} className="mr-1" />
      };
    }
    if (precip >= 5 && precip < 20) {
      return {
        title: "Hujan Sedang",
        desc: `Air sawah akan bertambah (${precip}mm). Tunda pemupukan.`,
        color: "text-amber-700 dark:text-amber-500",
        bg: "bg-amber-500/10 border-amber-500/20",
        icon: <Droplets size={14} className="mr-1" />
      };
    }
    if (precip > 0 && precip < 5) {
      return {
        title: "Gerimis",
        desc: "Hujan ringan, aman untuk tanaman padi.",
        color: "text-blue-700 dark:text-blue-400",
        bg: "bg-blue-500/10 border-blue-500/20",
        icon: <CloudRain size={14} className="mr-1" />
      };
    }
    if (code === 0 || (code >= 1 && code <= 3)) {
      return {
        title: "Sangat Bagus",
        desc: "Cuaca cerah, sangat cocok untuk menjemur padi/gabah.",
        color: "text-green-700 dark:text-green-500",
        bg: "bg-green-500/10 border-green-500/20",
        icon: <CheckCircle2 size={14} className="mr-1" />
      };
    }
    return {
      title: "Mendung / Teduh",
      desc: "Penjemuran mungkin kurang optimal hari ini.",
      color: "text-slate-700 dark:text-slate-400",
      bg: "bg-slate-500/10 border-slate-500/20",
      icon: <Cloud size={14} className="mr-1" />
    };
  };

  if (!device?.lat || !device?.lng) {
    return null; // Don't render if no location
  }

  if (loading) {
    return (
      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--bg-glass-border)] p-6 animate-shimmer h-full">
        <div className="h-4 w-32 bg-[var(--bg-glass)] rounded mb-4"></div>
        <div className="space-y-3">
           <div className="bg-[var(--bg-glass)] rounded-xl w-full h-20"></div>
           <div className="bg-[var(--bg-glass)] rounded-xl w-full h-20"></div>
           <div className="bg-[var(--bg-glass)] rounded-xl w-full h-20"></div>
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
        <CalendarDays size={20} className="text-blue-500" /> Info Cuaca Pertanian
      </h3>
      
      <div className="flex flex-col gap-3">
        {forecasts.map((f, i) => {
          const dateObj = new Date(f.date);
          const dateStr = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
          const dayName = i === 0 ? `HARI INI (${dateStr})` : i === 1 ? `BESOK (${dateStr})` : `${dateObj.toLocaleDateString('id-ID', { weekday: 'long' }).toUpperCase()} (${dateStr})`;
          const rec = getAgriRecommendation(f.weathercode, f.precipitation_sum);
          
          return (
            <div key={i} className="flex flex-col md:flex-row md:items-center gap-4 p-4 bg-[var(--bg-glass)] rounded-xl border border-[var(--bg-glass-border)] hover:bg-[var(--bg-card-hover)] transition-colors">
              {/* Left Side: Icon & Day */}
              <div className="flex items-center gap-4 md:w-48 shrink-0">
                <div className="w-12 h-12 bg-[var(--bg-primary)] rounded-full flex items-center justify-center border border-[var(--bg-glass-border)] shrink-0">
                  {getWeatherIcon(f.weathercode, 24)}
                </div>
                <div>
                  <div className="font-black text-[var(--text-primary)] tracking-wide">{dayName}</div>
                  <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mt-0.5">
                    <span className="flex items-center gap-0.5"><Thermometer size={12} /> {Math.round(f.temperature_max)}°</span>
                  </div>
                </div>
              </div>
              
              {/* Right Side: Layman Explanation & Quick Stats */}
              <div className={`flex-1 p-3 rounded-lg border ${rec.bg} flex items-center justify-between gap-4`}>
                <div>
                  <div className={`text-sm font-bold flex items-center ${rec.color}`}>
                    {rec.icon} {rec.title}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] mt-1">
                    {rec.desc}
                  </div>
                </div>
                
                {/* Data Badge (Fills the right space on Desktop) */}
                <div className="hidden sm:flex flex-col items-end shrink-0 text-[10px] text-[var(--text-secondary)]">
                  {f.precipitation_sum > 0 ? (
                    <div className="flex items-center gap-1.5 bg-[var(--bg-primary)] px-2.5 py-1.5 rounded-lg border border-[var(--bg-glass-border)] shadow-sm">
                      <Droplets size={14} className="text-blue-500" />
                      <span className="font-mono font-bold text-[var(--text-primary)] text-xs">{f.precipitation_sum}</span> mm
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 bg-[var(--bg-primary)] px-2.5 py-1.5 rounded-lg border border-[var(--bg-glass-border)] shadow-sm">
                      <Sun size={14} className="text-amber-500" />
                      <span className="font-mono font-bold text-[var(--text-primary)] text-xs">{(f.sunshine_duration / 3600).toFixed(1)}</span> jam
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
