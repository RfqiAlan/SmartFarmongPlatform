"use client";

import { useState, useEffect, useMemo } from "react";
import { useFirebaseData } from "@/hooks/useFirebaseData";
import { useDevices } from "@/hooks/useDevices";
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine 
} from "recharts";
import { 
  Droplets, TrendingUp, TrendingDown, Signal, 
  AlertTriangle, Filter, ChevronDown 
} from "lucide-react";

export default function AnalyticsPage() {
  const { devices, loading: devicesLoading } = useDevices();
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  
  // Set default selected device when devices load
  useEffect(() => {
    if (devices.length > 0 && !selectedDeviceId) {
      setSelectedDeviceId(devices[0].id);
    }
  }, [devices, selectedDeviceId]);

  const { data, loading: dataLoading } = useFirebaseData(selectedDeviceId || undefined, 200);

  // Computed analytics data
  const { chartData, kpi } = useMemo(() => {
    if (!data || data.length === 0) {
      return { chartData: [], kpi: null };
    }

    let sumLevel = 0;
    let sumSignal = 0;
    let maxLevel = -999;
    let minLevel = 999;

    const formattedData = data.map(d => {
      const level = parseFloat(d.water_level_cm.toString());
      const signal = d.signal_strength;
      
      sumLevel += level;
      sumSignal += signal;
      if (level > maxLevel) maxLevel = level;
      if (level < minLevel) minLevel = level;

      return {
        time: new Date(typeof d.created_at === 'number' ? d.created_at : d.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        waterLevel: level,
        signal: signal,
        status: d.status
      };
    });

    return {
      chartData: formattedData,
      kpi: {
        avgLevel: (sumLevel / data.length).toFixed(1),
        maxLevel: maxLevel.toFixed(1),
        minLevel: minLevel.toFixed(1),
        avgSignal: Math.round(sumSignal / data.length)
      }
    };
  }, [data]);

  const loading = devicesLoading || dataLoading;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--bg-glass-border)]">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">Analytics & Insight</h1>
          <p className="text-[var(--text-secondary)] mt-1 text-sm md:text-base">Analisa data historis tinggi air dan sinyal perangkat</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-glass)] border border-[var(--bg-glass-border)] rounded-lg">
            <Filter size={16} className="text-[var(--text-muted)]" />
            <select 
              className="bg-transparent text-[var(--text-primary)] text-sm font-medium focus:outline-none appearance-none pr-6 cursor-pointer"
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              disabled={devicesLoading || devices.length === 0}
            >
              {devicesLoading ? (
                <option value="">Memuat...</option>
              ) : devices.length === 0 ? (
                <option value="">Belum ada perangkat</option>
              ) : (
                devices.map(d => (
                  <option key={d.id} value={d.id} className="bg-[var(--bg-secondary)]">
                    {d.name.toUpperCase()}
                  </option>
                ))
              )}
            </select>
            <ChevronDown size={14} className="text-[var(--text-muted)] absolute right-9 pointer-events-none" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6 animate-shimmer">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-[var(--bg-glass)] rounded-2xl"></div>)}
          </div>
          <div className="h-[400px] bg-[var(--bg-glass)] rounded-2xl"></div>
        </div>
      ) : chartData.length === 0 ? (
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--bg-glass-border)] p-12 text-center">
          <AlertTriangle size={48} className="mx-auto text-amber-500 mb-4 opacity-50" />
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Belum Ada Data Historis</h3>
          <p className="text-[var(--text-secondary)]">Perangkat ini belum mengirimkan data. Silakan tunggu atau periksa koneksi alat Anda.</p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <div className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--bg-glass-border)] flex flex-col gap-2 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
              <div className="text-[var(--text-muted)] text-xs md:text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
                <Droplets size={16} className="text-blue-500" /> Rata-Rata Air
              </div>
              <div className="text-3xl md:text-4xl font-black font-mono text-[var(--text-primary)] mt-1">
                {kpi?.avgLevel} <span className="text-sm md:text-lg text-[var(--text-muted)] font-sans font-medium">cm</span>
              </div>
            </div>

            <div className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--bg-glass-border)] flex flex-col gap-2 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
              <div className="text-[var(--text-muted)] text-xs md:text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
                <TrendingUp size={16} className="text-green-500" /> Level Tertinggi
              </div>
              <div className="text-3xl md:text-4xl font-black font-mono text-green-600 dark:text-green-500 mt-1">
                {kpi?.maxLevel} <span className="text-sm md:text-lg text-[var(--text-muted)] font-sans font-medium">cm</span>
              </div>
            </div>

            <div className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--bg-glass-border)] flex flex-col gap-2 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
              <div className="text-[var(--text-muted)] text-xs md:text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
                <TrendingDown size={16} className="text-amber-500" /> Level Terendah
              </div>
              <div className="text-3xl md:text-4xl font-black font-mono text-amber-600 dark:text-amber-500 mt-1">
                {kpi?.minLevel} <span className="text-sm md:text-lg text-[var(--text-muted)] font-sans font-medium">cm</span>
              </div>
            </div>

            <div className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--bg-glass-border)] flex flex-col gap-2 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
              <div className="text-[var(--text-muted)] text-xs md:text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
                <Signal size={16} className="text-purple-500" /> Sinyal Rata-rata
              </div>
              <div className="text-3xl md:text-4xl font-black font-mono text-purple-600 dark:text-purple-500 mt-1">
                {kpi?.avgSignal} <span className="text-sm md:text-lg text-[var(--text-muted)] font-sans font-medium">CSQ</span>
              </div>
            </div>
          </div>

          {/* Main Chart Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Water Level Chart */}
            <div className="lg:col-span-2 bg-[var(--bg-card)] rounded-2xl border border-[var(--bg-glass-border)] p-6 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2 text-[var(--text-primary)]">
                  <Droplets size={20} className="text-blue-500" /> Tren Ketinggian Air
                </h3>
                <span className="text-xs text-[var(--text-muted)] px-3 py-1 bg-[var(--bg-glass)] rounded-full">
                  200 Data Terakhir
                </span>
              </div>
              <div className="h-[350px] w-full mt-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorWater" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--bg-glass-border)" />
                    <XAxis 
                      dataKey="time" 
                      stroke="var(--text-muted)" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      minTickGap={30}
                    />
                    <YAxis 
                      stroke="var(--text-muted)" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(value) => `${value}cm`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--bg-card)', 
                        borderColor: 'var(--bg-glass-border)',
                        borderRadius: '12px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                      }}
                      itemStyle={{ color: 'var(--text-primary)', fontWeight: 'bold' }}
                      labelStyle={{ color: 'var(--text-secondary)', marginBottom: '4px' }}
                    />
                    <ReferenceLine y={5} stroke="#22c55e" strokeDasharray="3 3" opacity={0.5} />
                    <ReferenceLine y={-10} stroke="#f59e0b" strokeDasharray="3 3" opacity={0.5} />
                    <Area 
                      type="monotone" 
                      dataKey="waterLevel" 
                      name="Tinggi Air" 
                      stroke="#3b82f6" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorWater)" 
                      animationDuration={1000}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Signal Quality Chart */}
            <div className="lg:col-span-1 bg-[var(--bg-card)] rounded-2xl border border-[var(--bg-glass-border)] p-6 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2 text-[var(--text-primary)]">
                  <Signal size={20} className="text-purple-500" /> Kualitas Jaringan
                </h3>
              </div>
              <div className="h-[350px] w-full mt-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSignal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.9}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--bg-glass-border)" />
                    <XAxis 
                      dataKey="time" 
                      stroke="var(--text-muted)" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      minTickGap={30}
                    />
                    <YAxis 
                      stroke="var(--text-muted)" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <Tooltip 
                      cursor={{fill: 'var(--bg-glass)'}}
                      contentStyle={{ 
                        backgroundColor: 'var(--bg-card)', 
                        borderColor: 'var(--bg-glass-border)',
                        borderRadius: '12px'
                      }}
                      itemStyle={{ color: 'var(--text-primary)', fontWeight: 'bold' }}
                    />
                    <Bar 
                      dataKey="signal" 
                      name="Sinyal GSM" 
                      fill="url(#colorSignal)" 
                      radius={[4, 4, 0, 0]} 
                      maxBarSize={40}
                      animationDuration={1000}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}
