"use client";

import { useState } from "react";
import { useDevices } from "@/hooks/useDevices";
import { useLatestDataForAllDevices, SensorData } from "@/hooks/useFirebaseData";
import { Plus, Trash2, Signal, Clock } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import dynamic from "next/dynamic";
import Swal from "sweetalert2";

const MapPicker = dynamic(() => import("@/components/devices/MapPicker"), { 
  ssr: false,
  loading: () => <div className="h-[250px] w-full bg-[var(--bg-glass)] rounded-xl flex items-center justify-center animate-shimmer border border-[var(--bg-glass-border)]">Memuat peta...</div>
});

export function DeviceGrid() {
  const { devices, loading: devicesLoading, addDevice, removeDevice } = useDevices();
  const { latestData, loading: dataLoading } = useLatestDataForAllDevices();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newDeviceId, setNewDeviceId] = useState("");
  const [newDeviceName, setNewDeviceName] = useState("");
  const [newLat, setNewLat] = useState("");
  const [newLng, setNewLng] = useState("");
  const [error, setError] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await addDevice(
        newDeviceId, 
        newDeviceName || newDeviceId,
        newLat ? parseFloat(newLat) : undefined,
        newLng ? parseFloat(newLng) : undefined
      );
      setIsAddModalOpen(false);
      setNewDeviceId("");
      setNewDeviceName("");
      setNewLat("");
      setNewLng("");
      
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: 'Device baru berhasil ditambahkan.',
        background: 'var(--bg-secondary)',
        color: 'var(--text-primary)',
        confirmButtonColor: '#3b82f6'
      });
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    
    const result = await Swal.fire({
      title: 'Hapus Device?',
      text: `Anda yakin ingin menghapus device ${id}? Data sensor tidak akan ikut terhapus.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#3b82f6',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
      background: 'var(--bg-secondary)',
      color: 'var(--text-primary)'
    });

    if (result.isConfirmed) {
      await removeDevice(id);
      Swal.fire({
        icon: 'success',
        title: 'Terhapus!',
        text: 'Device telah dihapus dari dashboard.',
        background: 'var(--bg-secondary)',
        color: 'var(--text-primary)',
        confirmButtonColor: '#3b82f6'
      });
    }
  };

  if (devicesLoading) {
    return <div className="text-[var(--text-muted)] p-8 text-center animate-shimmer">Memuat daftar device...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">Overview</h1>
          <p className="text-[var(--text-secondary)] mt-1">Total {devices.length} device aktif</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all"
        >
          <Plus size={18} /> Tambah Device
        </button>
      </div>

      {devices.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 text-center border border-dashed border-[var(--bg-glass-border)] rounded-2xl">
          <div className="w-16 h-16 rounded-full bg-[var(--bg-glass)] flex items-center justify-center mb-4 text-[var(--text-muted)]">
            <Plus size={32} />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-[var(--text-primary)]">Belum ada device</h3>
          <p className="text-[var(--text-secondary)] max-w-sm mb-6">Tambahkan ESP32 Water Monitor pertama Anda untuk mulai melihat data real-time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {devices.map((device) => {
            const data = latestData[device.id];
            return (
              <DeviceCard 
                key={device.id} 
                device={device} 
                data={data} 
                onDelete={(e) => handleDelete(e, device.id)} 
              />
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-secondary)] border border-[var(--bg-glass-border)] rounded-2xl w-full max-w-2xl shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[var(--bg-glass-border)] flex justify-between items-center sticky top-0 bg-[var(--bg-secondary)] z-10">
              <h3 className="text-xl font-bold">Tambah Device</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-[var(--text-muted)] hover:text-white">✕</button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Device ID (Hardware)</label>
                  <input 
                    required
                    type="text" 
                    value={newDeviceId}
                    onChange={e => setNewDeviceId(e.target.value)}
                    className="w-full px-4 py-2 bg-[var(--bg-glass)] border border-[var(--bg-glass-border)] rounded-lg text-white focus:border-blue-500 outline-none"
                    placeholder="e.g., flood-node-01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Nama Lokasi</label>
                  <input 
                    type="text" 
                    value={newDeviceName}
                    onChange={e => setNewDeviceName(e.target.value)}
                    className="w-full px-4 py-2 bg-[var(--bg-glass)] border border-[var(--bg-glass-border)] rounded-lg text-white focus:border-blue-500 outline-none"
                    placeholder="e.g., Sawah Blok A"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Lokasi Peta</label>
                <MapPicker 
                  lat={newLat ? parseFloat(newLat) : 0}
                  lng={newLng ? parseFloat(newLng) : 0}
                  onChange={(lat, lng) => {
                    setNewLat(lat.toString());
                    setNewLng(lng.toString());
                  }}
                />
                
                {/* Manual Coordinate Inputs */}
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Latitude (Garis Lintang)</label>
                    <input 
                      type="number" 
                      step="any"
                      value={newLat}
                      onChange={e => setNewLat(e.target.value)}
                      className="w-full px-3 py-1.5 bg-[var(--bg-glass)] border border-[var(--bg-glass-border)] rounded-lg text-white focus:border-blue-500 outline-none text-sm transition-colors"
                      placeholder="e.g. -6.200000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Longitude (Garis Bujur)</label>
                    <input 
                      type="number"
                      step="any" 
                      value={newLng}
                      onChange={e => setNewLng(e.target.value)}
                      className="w-full px-3 py-1.5 bg-[var(--bg-glass)] border border-[var(--bg-glass-border)] rounded-lg text-white focus:border-blue-500 outline-none text-sm transition-colors"
                      placeholder="e.g. 106.816666"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-[var(--text-muted)] italic">
                  *Anda dapat mengisi koordinat manual jika memiliki data GPS sendiri, atau cukup klik/cari pada peta.
                </p>
              </div>
              {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-[var(--text-secondary)] hover:text-white">Batal</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function DeviceCard({ device, data, onDelete }: { device: any, data?: SensorData, onDelete: (e: React.MouseEvent) => void }) {
  const hasData = !!data;
  const level = hasData ? parseFloat(data.water_level_cm.toString()) : 0;
  
  let isStale = true;
  let timeAgo = "Belum ada data";
  
  if (hasData && data.created_at) {
    const dataTime = typeof data.created_at === 'number' ? data.created_at : new Date(data.created_at).getTime();
    const ageMs = Date.now() - dataTime;
    isStale = ageMs > 6 * 60 * 60 * 1000;
    timeAgo = formatDistanceToNow(dataTime, { addSuffix: true, locale: idLocale });
  }

  const status = isStale && !hasData ? 'OFFLINE' : (hasData ? data.status : 'OFFLINE');
  const levelStr = hasData ? (level >= 0 ? `+${level.toFixed(1)}` : level.toFixed(1)) : '--.-';

  // Determine status color class
  let borderColor = "border-[var(--bg-glass-border)]";
  let statusColor = "text-[var(--text-muted)]";
  let bgGlow = "";

  if (status.includes("AMAN")) {
    borderColor = "border-green-500/50 hover:border-green-500";
    statusColor = "text-green-600 dark:text-green-500";
    bgGlow = "shadow-[inset_0_-3px_0_rgba(34,197,94,1)]";
  } else if (status.includes("KEKERINGAN")) {
    borderColor = "border-amber-500/50 hover:border-amber-500";
    statusColor = "text-amber-600 dark:text-amber-500";
    bgGlow = "shadow-[inset_0_-3px_0_rgba(245,158,11,1)]";
  } else if (status.includes("KELEBIHAN")) {
    borderColor = "border-red-500/50 hover:border-red-500";
    statusColor = "text-red-600 dark:text-red-500";
    bgGlow = "shadow-[inset_0_-3px_0_rgba(239,68,68,1)]";
  }

  return (
    <Link href={`/devices/${device.id}`} className={`block bg-[var(--bg-card)] rounded-2xl p-6 border ${borderColor} ${bgGlow} transition-all hover:-translate-y-1 hover:shadow-xl group relative overflow-hidden`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-lg text-[var(--text-primary)]">{device.name}</h3>
          <p className="text-xs text-[var(--text-muted)] font-mono">{device.id}</p>
        </div>
        <button 
          onClick={onDelete}
          className="p-1.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="my-6">
        <div className={`text-5xl font-black font-mono ${statusColor} tracking-tighter flex items-end gap-1`}>
          {levelStr} <span className="text-sm font-normal text-[var(--text-secondary)] pb-2 tracking-normal">cm</span>
        </div>
        <div className={`text-xs font-bold mt-2 uppercase tracking-widest ${statusColor}`}>
          • {status}
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)] font-mono border-t border-[var(--bg-glass-border)] pt-4 mt-4">
        <div className="flex items-center gap-1" title="Signal Strength">
          <Signal size={14} className="text-green-600 dark:text-green-400" />
          {hasData ? data.signal_strength : '--'}
        </div>
        <div className="flex items-center gap-1 ml-auto" title="Last Update">
          <Clock size={14} className="text-blue-600 dark:text-blue-400" />
          <span className="font-sans italic">{timeAgo}</span>
        </div>
      </div>
    </Link>
  );
}
