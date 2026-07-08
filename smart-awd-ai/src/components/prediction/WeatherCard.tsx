"use client";

import { useEffect, useState } from "react";
import { fetchCurrentWeather, CurrentWeather } from "@/utils/weatherApi";
import { Cloud, Sun, CloudRain, CloudLightning, CloudSnow, Wind, Thermometer, MapPin } from "lucide-react";

export default function WeatherCard({ device }: { device: any }) {
  const [weather, setWeather] = useState<CurrentWeather | null>(null);
  const [locationName, setLocationName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWeather() {
      if (!device?.lat || !device?.lng) {
        setLoading(false);
        return;
      }
      setLoading(true);
      
      try {
        const data = await fetchCurrentWeather(device.lat, device.lng);
        setWeather(data);
        
        // Fetch location name (Reverse Geocoding)
        try {
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${device.lat}&lon=${device.lng}&zoom=14&addressdetails=1`).catch(() => null);
          if (geoRes && geoRes.ok) {
            const geoData = await geoRes.json();
            if (geoData.address) {
              const addr = geoData.address;
              const village = addr.village || addr.suburb || addr.neighbourhood || addr.hamlet;
              const district = addr.city_district || addr.county || addr.town || addr.city;
              
              let locStr = "";
              if (village) locStr += `${village}`;
              if (village && district) locStr += ", ";
              if (district) locStr += `${district}`;
              
              if (locStr) setLocationName(locStr);
            }
          }
        } catch (err) {
          console.error("Error fetching location:", err);
        }
      } catch (err) {
        console.error("Failed to load weather data:", err);
      } finally {
        setLoading(false);
      }
    }
    
    loadWeather();
  }, [device]);

  // Helper to map WMO weather code to icon and description
  const getWeatherDetails = (code: number) => {
    if (code === 0) return { icon: <Sun size={32} className="text-yellow-600 dark:text-yellow-400" />, text: "Cerah" };
    if (code >= 1 && code <= 3) return { icon: <Cloud size={32} className="text-gray-500 dark:text-gray-300" />, text: "Berawan" };
    if (code === 45 || code === 48) return { icon: <Cloud size={32} className="text-gray-600 dark:text-gray-400" />, text: "Kabut" };
    if (code >= 51 && code <= 67) return { icon: <CloudRain size={32} className="text-blue-600 dark:text-blue-400" />, text: "Hujan Ringan" };
    if (code >= 80 && code <= 82) return { icon: <CloudRain size={32} className="text-blue-700 dark:text-blue-500" />, text: "Hujan Lebat" };
    if (code >= 95 && code <= 99) return { icon: <CloudLightning size={32} className="text-yellow-600 dark:text-yellow-500" />, text: "Badai Petir" };
    if (code >= 71 && code <= 77) return { icon: <CloudSnow size={32} className="text-gray-500 dark:text-white" />, text: "Salju" };
    
    return { icon: <Cloud size={32} className="text-gray-600 dark:text-gray-400" />, text: "Berawan" };
  };

  if (!device?.lat || !device?.lng) {
    return null; // Don't render if no location
  }

  if (loading) {
    return (
      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--bg-glass-border)] p-6 animate-shimmer flex flex-col gap-4">
        <div className="h-4 w-32 bg-[var(--bg-glass)] rounded"></div>
        <div className="flex gap-4">
           <div className="w-16 h-16 bg-[var(--bg-glass)] rounded-full"></div>
           <div className="flex-1 space-y-2">
              <div className="h-6 bg-[var(--bg-glass)] rounded w-1/2"></div>
              <div className="h-4 bg-[var(--bg-glass)] rounded w-1/3"></div>
           </div>
        </div>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--bg-glass-border)] p-6 text-[var(--text-muted)] text-sm">
        Gagal memuat data cuaca.
      </div>
    );
  }

  const { icon, text } = getWeatherDetails(weather.weathercode);

  return (
    <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--bg-glass-border)] p-6 flex flex-col justify-center relative overflow-hidden group">
      <div className="absolute -right-6 -top-6 opacity-5 rotate-12 pointer-events-none">
        <Cloud size={150} />
      </div>
      
      <h3 className="text-sm font-semibold uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2">
        <MapPin size={14} /> Cuaca Saat Ini
      </h3>
      
      {locationName ? (
        <div className="text-xs text-[var(--text-secondary)] mb-4 truncate mt-1" title={locationName}>
          📍 {locationName}
        </div>
      ) : (
        <div className="mb-4"></div>
      )}
      
      <div className="flex items-center gap-6 mb-4">
        <div className="p-3 bg-[var(--bg-glass)] rounded-2xl border border-[var(--bg-glass-border)]">
          {icon}
        </div>
        <div>
          <div className="text-4xl font-black font-mono tracking-tighter text-[var(--text-primary)] flex items-start">
            {weather.temperature.toFixed(1)}<span className="text-lg mt-1 text-[var(--text-secondary)]">°C</span>
          </div>
          <div className="text-[var(--text-secondary)] font-medium">
            {text}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mt-auto pt-2 border-t border-[var(--bg-glass-border)]">
        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <Thermometer size={14} className="text-orange-600 dark:text-orange-400" />
          <span>Suhu Udara</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <Wind size={14} className="text-cyan-600 dark:text-cyan-400" />
          <span>{weather.windspeed} km/h</span>
        </div>
      </div>
    </div>
  );
}
