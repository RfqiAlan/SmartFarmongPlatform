"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, Trash2 } from "lucide-react";
import { ref, get, query, orderByChild, equalTo, update } from "firebase/database";
import { database } from "@/lib/firebase";
import { useFirebaseData } from "@/hooks/useFirebaseData";
import { useDevices } from "@/hooks/useDevices";
import PredictionCard from "@/components/prediction/PredictionCard";
import WeatherCard from "@/components/prediction/WeatherCard";
import ForecastCard from "@/components/prediction/ForecastCard";
import AiAssistant from "@/components/chat/AiAssistant";
import CalibrationPanel from "@/components/devices/CalibrationPanel";

export default function DeviceDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, loading: dataLoading } = useFirebaseData(id, 100);
  const { devices, loading: devicesLoading } = useDevices();
  const [isResetting, setIsResetting] = useState(false);

  const loading = dataLoading || devicesLoading;

  const currentDevice = devices.find(d => d.id === id);
  const currentData = data.length > 0 ? data[data.length - 1] : null;

  const handleResetData = async () => {
    if (!window.confirm(`Yakin ingin mereset seluruh log data untuk perangkat ${currentDevice?.name || id}? Tindakan ini tidak bisa dibatalkan.`)) {
      return;
    }
    
    setIsResetting(true);
    try {
      // Find all nodes in "data" where device_id matches
      const q = query(ref(database, "data"), orderByChild("device_id"), equalTo(id));
      const snapshot = await get(q);
      
      if (snapshot.exists()) {
        const updates: any = {};
        snapshot.forEach((child) => {
          updates[child.key] = null;
        });
        await update(ref(database, "data"), updates);
        alert("Berhasil mereset log data! Silakan tunggu data baru masuk.");
      } else {
        alert("Tidak ada data untuk dihapus.");
      }
    } catch (err) {
      console.error("Gagal mereset data:", err);
      alert("Terjadi kesalahan saat mereset data.");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex items-center gap-4 mb-8">
        <Link 
          href="/dashboard"
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--bg-glass)] border border-[var(--bg-glass-border)] hover:bg-[var(--bg-card-hover)] transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Device Detail</h1>
          <p className="text-[var(--text-secondary)] font-mono text-sm">{id}</p>
        </div>
      </div>

      {loading ? (
        <div className="animate-shimmer flex space-x-4">
          <div className="flex-1 space-y-6 py-1">
            <div className="h-64 bg-[var(--bg-glass)] rounded-xl"></div>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="h-32 bg-[var(--bg-glass)] rounded-xl col-span-2"></div>
                <div className="h-32 bg-[var(--bg-glass)] rounded-xl col-span-1"></div>
              </div>
            </div>
          </div>
        </div>
      ) : !currentData ? (
        <div className="text-center p-12 bg-[var(--bg-card)] rounded-2xl border border-[var(--bg-glass-border)]">
          <h2 className="text-xl font-semibold mb-2 text-[var(--text-primary)]">Belum ada data</h2>
          <p className="text-[var(--text-secondary)]">Menunggu data pertama dari device ini...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 dashboard-grid-layout">
          {/* Row 1: Main Level, Device Info, & Current Weather */}
          <div className="md:col-span-2 bg-[var(--bg-card)] rounded-2xl border border-[var(--bg-glass-border)] p-8 flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-50"></div>
            <div className="text-sm font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-6 absolute top-6 left-6">
              💧 Level Air Terkini
            </div>
            
            <div className="flex items-end gap-2 my-8">
              <span className={`text-5xl md:text-7xl font-black font-mono tracking-tighter ${
                currentData.status.includes('AMAN') ? 'text-green-600 dark:text-green-500' : 
                currentData.status.includes('KELEBIHAN') ? 'text-red-600 dark:text-red-500' : 'text-amber-600 dark:text-amber-500'
              }`}>
                {parseFloat(currentData.water_level_cm.toString()).toFixed(1)}
              </span>
              <span className="text-2xl text-[var(--text-secondary)] mb-2">cm</span>
            </div>
            
            <div className={`px-6 py-2 rounded-full font-bold text-sm tracking-wider uppercase flex items-center gap-2 ${
                currentData.status.includes('AMAN') ? 'bg-green-500/10 text-green-600 dark:text-green-500 border border-green-500/20' : 
                currentData.status.includes('KELEBIHAN') ? 'bg-red-500/10 text-red-600 dark:text-red-500 border border-red-500/20 animate-pulse' : 
                'bg-amber-500/10 text-amber-600 dark:text-amber-500 border border-amber-500/20'
              }`}>
              <div className="w-2 h-2 rounded-full bg-current"></div>
              {currentData.status}
            </div>
          </div>

          {/* Device Info */}
          <div className="md:col-span-1 bg-[var(--bg-card)] rounded-2xl border border-[var(--bg-glass-border)] p-6 flex flex-col gap-4 min-h-[300px]">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-2">⚡ Status Perangkat</h3>
            
            <div className="bg-[var(--bg-glass)] rounded-xl p-4 border border-[var(--bg-glass-border)]">
              <div className="text-[var(--text-secondary)] text-xs mb-1">Nama Perangkat</div>
              <div className="text-lg font-bold text-[var(--text-primary)] uppercase truncate">{currentDevice?.name || id}</div>
            </div>

            <div className="bg-[var(--bg-glass)] rounded-xl p-4 border border-[var(--bg-glass-border)]">
              <div className="text-[var(--text-secondary)] text-xs mb-1">Kualitas Sinyal (GSM)</div>
              <div className="text-2xl font-bold font-mono text-purple-600 dark:text-purple-400">{currentData.signal_strength}</div>
            </div>
            
            <div className="bg-[var(--bg-glass)] rounded-xl p-4 border border-[var(--bg-glass-border)] mt-auto">
              <div className="text-[var(--text-secondary)] text-xs mb-1">Pembaruan Terakhir</div>
              <div className="text-sm font-medium">
                {new Date(typeof currentData.created_at === 'number' ? currentData.created_at : currentData.created_at).toLocaleString('id-ID')}
              </div>
            </div>
          </div>
          
          <div className="md:col-span-1 h-full">
            <WeatherCard device={currentDevice} />
          </div>
          
          {/* Row 2: 3-Day Forecast */}
          <div className="md:col-span-4 mt-2">
            <ForecastCard device={currentDevice} />
          </div>
          
          {/* Row 3: AI Prediction */}
          <div className="md:col-span-4 mt-2">
            <PredictionCard device={currentDevice} data={data} />
          </div>

          {/* Row 4: Calibration Panel */}
          <div className="md:col-span-4 mt-2">
            <CalibrationPanel deviceId={id} />
          </div>

          {/* Row 4: History Log Table */}
          <div className="md:col-span-4 bg-[var(--bg-card)] rounded-2xl border border-[var(--bg-glass-border)] p-6 mt-2">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Clock size={20} className="text-blue-600 dark:text-blue-400" /> Log Riwayat Data (100 Terakhir)
              </h3>
              <button 
                onClick={handleResetData}
                disabled={isResetting || data.length === 0}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-500 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-colors disabled:opacity-50"
              >
                <Trash2 size={14} />
                {isResetting ? 'Mereset...' : 'Reset Log AI'}
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--bg-glass-border)] text-[var(--text-secondary)]">
                    <th className="pb-3 font-medium">Waktu</th>
                    <th className="pb-3 font-medium text-right">Air (cm)</th>
                    <th className="pb-3 font-medium text-center">Status</th>
                    <th className="pb-3 font-medium text-right">Sinyal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--bg-glass-border)]">
                  {[...data].reverse().map((row, idx) => (
                    <tr key={idx} className="hover:bg-[var(--bg-glass)] transition-colors">
                      <td className="py-3 text-[var(--text-primary)]">
                        {new Date(typeof row.created_at === 'number' ? row.created_at : row.created_at).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 text-right font-mono text-blue-600 dark:text-blue-400">
                        {row.water_level_cm}
                      </td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          row.status.includes('AMAN') ? 'bg-green-500/10 text-green-600 dark:text-green-500' : 
                          row.status.includes('KELEBIHAN') ? 'bg-red-500/10 text-red-600 dark:text-red-500' : 
                          'bg-amber-500/10 text-amber-600 dark:text-amber-500'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="py-3 text-right font-mono text-purple-600 dark:text-purple-400">
                        {row.signal_strength}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.length === 0 && (
                <div className="text-center py-6 text-[var(--text-muted)]">Belum ada riwayat data</div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Floating AI Chat Assistant */}
      {!loading && currentData && (
        <AiAssistant 
          deviceDataContext={`Level Air: ${currentData.water_level_cm} cm. Status: ${currentData.status}.`}
        />
      )}
    </div>
  );
}
