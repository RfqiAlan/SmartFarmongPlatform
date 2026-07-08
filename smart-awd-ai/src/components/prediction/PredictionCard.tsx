"use client";

import { useEffect, useState } from "react";
import { SensorData } from "@/hooks/useFirebaseData";
import { fetchWeatherForecast, WeatherForecast } from "@/utils/weatherApi";
import { calculateTrend, predictFutureWaterLevel, PredictionResult } from "@/utils/aiPrediction";
import { BrainCircuit, CloudRain, TrendingDown, TrendingUp, AlertTriangle, Info, CheckCircle2 } from "lucide-react";

export default function PredictionCard({ 
  device, 
  data 
}: { 
  device: any, 
  data: SensorData[] 
}) {
  const [forecasts, setForecasts] = useState<WeatherForecast[]>([]);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function runPrediction() {
      if (!device?.lat || !device?.lng) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      // 1. Fetch Weather
      const weather = await fetchWeatherForecast(device.lat, device.lng);
      setForecasts(weather);
      
      // 2. Run AI Logic
      if (data.length > 0) {
        const trend = calculateTrend(data);
        const currentLevel = parseFloat(data[data.length - 1].water_level_cm.toString());
        const result = predictFutureWaterLevel(currentLevel, trend, weather);
        setPrediction(result);
      }
      
      setLoading(false);
    }
    
    runPrediction();
  }, [device, data]);

  if (!device?.lat || !device?.lng) {
    return (
      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--bg-glass-border)] p-6">
        <div className="flex items-center gap-3 text-amber-400 mb-2">
          <AlertTriangle size={24} />
          <h3 className="text-lg font-bold">AI Prediction Tidak Aktif</h3>
        </div>
        <p className="text-[var(--text-secondary)] text-sm">
          Perangkat ini belum mengatur titik koordinat (Latitude/Longitude). AI membutuhkan lokasi untuk mengambil data cuaca (hujan) dalam sistem prediksi.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--bg-glass-border)] p-6 animate-shimmer">
        <div className="h-6 w-48 bg-[var(--bg-glass)] rounded mb-4"></div>
        <div className="h-24 bg-[var(--bg-glass)] rounded-xl mb-4"></div>
        <div className="h-12 bg-[var(--bg-glass)] rounded-xl"></div>
      </div>
    );
  }

  if (!prediction) {
    return (
      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--bg-glass-border)] p-6 text-center text-[var(--text-muted)]">
        Menunggu cukup data untuk melakukan prediksi AI...
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--bg-glass-border)] overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-[var(--bg-glass-border)] flex items-center justify-between bg-gradient-to-r from-blue-900/20 to-purple-900/20">
        <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
          <BrainCircuit size={20} className="text-purple-600 dark:text-purple-400" />
          AI Smart Prediction (3 Hari)
        </h3>
        
        {prediction.status === "AMAN" && <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 bg-green-500/20 text-green-700 dark:text-green-400 rounded-full"><CheckCircle2 size={12}/> AMAN</span>}
        {prediction.status === "WASPADA" && <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded-full"><AlertTriangle size={12}/> WASPADA</span>}
        {prediction.status === "KRITIS" && <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 bg-red-500/20 text-red-700 dark:text-red-400 rounded-full animate-pulse"><AlertTriangle size={12}/> KRITIS</span>}
      </div>

      <div className="p-5 space-y-6">
        {/* Recommendation Alert Box */}
        <div className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center transition-colors ${
          prediction.status === "AMAN" ? "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400" :
          prediction.status === "WASPADA" ? "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400" :
          "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400"
        }`}>
          <div className="mt-0.5"><Info size={18} /></div>
          <div>
            <div className="font-bold mb-1">Rekomendasi AI:</div>
            <p className="text-sm opacity-90">{prediction.recommendation}</p>
          </div>
        </div>

        {/* Prediction Data Grid */}
        <div>
          <h4 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">Prakiraan Level Air</h4>
          <div className="grid grid-cols-3 gap-3">
            {prediction.predictedLevels.map((p, i) => (
              <div key={i} className="bg-[var(--bg-glass)] rounded-xl p-3 border border-[var(--bg-glass-border)] text-center relative overflow-hidden group">
                <div className="text-xs text-[var(--text-secondary)] mb-1 font-medium">{p.time}</div>
                <div className={`text-xl font-bold font-mono ${p.level < -10 ? 'text-amber-600 dark:text-amber-500' : p.level > 10 ? 'text-red-600 dark:text-red-500' : 'text-blue-600 dark:text-blue-400'}`}>
                  {p.level > 0 ? '+' : ''}{p.level.toFixed(1)}<span className="text-xs">cm</span>
                </div>
                
                {/* Weather overlay */}
                <div className="mt-2 text-xs flex items-center justify-center gap-1 text-[var(--text-secondary)]">
                  <CloudRain size={12} className={p.precipitation > 0 ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-gray-500"} />
                  <span className={`text-[10px] ${p.precipitation > 0 ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-[var(--text-muted)]'}`}>
                    {p.precipitation} mm
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Trend Info */}
        <div className="flex items-center justify-between text-xs text-[var(--text-muted)] border-t border-[var(--bg-glass-border)] pt-4">
          <div className="flex items-center gap-1">
            <span className="font-semibold text-[var(--text-secondary)]">Tren Historis 24j:</span>
            {prediction.trendSlope > 0 ? (
              <span className="flex items-center text-blue-600 dark:text-blue-400"><TrendingUp size={12} className="mr-1"/> Naik ({(prediction.trendSlope * 24).toFixed(1)}cm/hari)</span>
            ) : (
              <span className="flex items-center text-amber-600 dark:text-amber-400"><TrendingDown size={12} className="mr-1"/> Turun ({Math.abs(prediction.trendSlope * 24).toFixed(1)}cm/hari)</span>
            )}
          </div>
          <div className="text-[var(--text-muted)] italic">
            Zero-budget local ML
          </div>
        </div>

      </div>
    </div>
  );
}
