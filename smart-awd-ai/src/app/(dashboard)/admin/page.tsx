"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useDevices } from "@/hooks/useDevices";
import { useLatestDataForAllDevices } from "@/hooks/useFirebaseData";
import { setAdminOverride, clearAdminOverride } from "@/hooks/useAdminOverride";
import { database } from "@/lib/firebase";
import { ref, push } from "firebase/database";
import { 
  ShieldAlert, 
  Send, 
  Zap, 
  Droplets, 
  Signal as SignalIcon, 
  Battery, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  RotateCcw,
  Play,
  Square,
  Radio,
  Gauge,
  Shuffle
} from "lucide-react";
import Swal from "sweetalert2";
import Link from "next/link";

// Presets for quick injection
const PRESETS = [
  {
    name: "✅ Normal / Aman",
    description: "Level air ideal, semua sensor normal",
    values: { water_level_cm: 3.5, status: "AMAN", battery_voltage: 4.1, signal_strength: 22 },
    color: "from-green-600 to-emerald-600",
    border: "border-green-500/30 hover:border-green-500/60",
  },
  {
    name: "⚠️ Kekeringan",
    description: "Level air terlalu rendah, sawah butuh pengairan",
    values: { water_level_cm: -2.5, status: "KEKERINGAN", battery_voltage: 3.7, signal_strength: 18 },
    color: "from-amber-600 to-orange-600",
    border: "border-amber-500/30 hover:border-amber-500/60",
  },
  {
    name: "🔴 Kelebihan Air",
    description: "Level air terlalu tinggi, potensi banjir",
    values: { water_level_cm: 8.2, status: "KELEBIHAN", battery_voltage: 3.9, signal_strength: 15 },
    color: "from-red-600 to-rose-600",
    border: "border-red-500/30 hover:border-red-500/60",
  },
  {
    name: "💀 Baterai Kritis",
    description: "Baterai hampir habis, sinyal lemah",
    values: { water_level_cm: 1.0, status: "AMAN", battery_voltage: 2.8, signal_strength: 5 },
    color: "from-purple-600 to-violet-600",
    border: "border-purple-500/30 hover:border-purple-500/60",
  },
  {
    name: "📡 Sinyal Hilang",
    description: "Sinyal sangat lemah/putus, data tidak stabil",
    values: { water_level_cm: 0.0, status: "AMAN", battery_voltage: 3.5, signal_strength: 0 },
    color: "from-slate-600 to-zinc-600",
    border: "border-slate-500/30 hover:border-slate-500/60",
  },
];

export default function AdminPage() {
  const { devices, loading: devicesLoading } = useDevices();
  const { latestData } = useLatestDataForAllDevices();

  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [waterLevel, setWaterLevel] = useState<string>("3.5");
  const [status, setStatus] = useState<string>("AMAN");
  const [batteryVoltage, setBatteryVoltage] = useState<string>("4.1");
  const [signalStrength, setSignalStrength] = useState<string>("22");
  const [isSending, setIsSending] = useState(false);
  const [isAutoInjecting, setIsAutoInjecting] = useState(false);
  const [autoInjectCount, setAutoInjectCount] = useState(0);
  const [randomSignal, setRandomSignal] = useState(false);
  const [history, setHistory] = useState<Array<{ device: string; status: string; time: string }>>([]);
  const autoInjectRef = useRef<NodeJS.Timeout | null>(null);
  const autoInjectDeviceRef = useRef<string>("");
  const lastRandomSignalRef = useRef(22);  // tracks last random value for smooth walk
  const randomSignalRef = useRef(false);

  // Cleanup interval and override on unmount
  useEffect(() => {
    return () => {
      if (autoInjectRef.current) {
        clearInterval(autoInjectRef.current);
      }
      if (autoInjectDeviceRef.current) {
        clearAdminOverride(autoInjectDeviceRef.current);
      }
    };
  }, []);

  // Store latest values in refs so the interval callback always reads current values
  const waterLevelRef = useRef(waterLevel);
  const statusRef = useRef(status);
  const batteryVoltageRef = useRef(batteryVoltage);
  const signalStrengthRef = useRef(signalStrength);
  useEffect(() => { waterLevelRef.current = waterLevel; }, [waterLevel]);
  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => { batteryVoltageRef.current = batteryVoltage; }, [batteryVoltage]);
  useEffect(() => { signalStrengthRef.current = signalStrength; }, [signalStrength]);
  useEffect(() => { randomSignalRef.current = randomSignal; }, [randomSignal]);

  const handleAutoInject = useCallback(async () => {
    if (isAutoInjecting) {
      // STOP auto inject
      if (autoInjectRef.current) {
        clearInterval(autoInjectRef.current);
        autoInjectRef.current = null;
      }
      // Remove override from localStorage
      if (autoInjectDeviceRef.current) {
        clearAdminOverride(autoInjectDeviceRef.current);
      }
      setIsAutoInjecting(false);
      setAutoInjectCount(0);
      Swal.fire({
        icon: "info",
        title: "Auto Inject Dihentikan",
        text: "Sensor asli sekarang bisa mengirim data kembali.",
        background: "var(--bg-secondary)",
        color: "var(--text-primary)",
        confirmButtonColor: "#3b82f6",
        timer: 2000,
        timerProgressBar: true,
      });
      return;
    }

    if (!selectedDevice) {
      Swal.fire({ icon: "warning", title: "Pilih Device!", text: "Silakan pilih device target.", background: "var(--bg-secondary)", color: "var(--text-primary)", confirmButtonColor: "#3b82f6" });
      return;
    }

    // START auto inject
    autoInjectDeviceRef.current = selectedDevice;
    setIsAutoInjecting(true);
    setAutoInjectCount(0);

    // Set admin override in localStorage so UI hides real sensor data
    setAdminOverride(selectedDevice);

    // Send first data immediately
    const sendOne = async () => {
      // Random walk for signal: ±1 or ±2 step, clamped to 15-28
      let sig = parseInt(signalStrengthRef.current);
      if (randomSignalRef.current) {
        const step = Math.random() < 0.7 ? 1 : 2; // mostly ±1, sometimes ±2
        const direction = Math.random() < 0.5 ? -1 : 1;
        sig = lastRandomSignalRef.current + step * direction;
        sig = Math.max(15, Math.min(28, sig));
        lastRandomSignalRef.current = sig;
        setSignalStrength(sig.toString());
      }

      const payload = {
        device_id: autoInjectDeviceRef.current,
        water_level_cm: parseFloat(waterLevelRef.current),
        status: statusRef.current,
        battery_voltage: parseFloat(batteryVoltageRef.current),
        signal_strength: sig,
        created_at: Date.now(),
        _source: "admin_auto",
      };
      await push(ref(database, "data"), payload);
      setAutoInjectCount((prev) => prev + 1);
      setHistory((prev) => [
        { device: autoInjectDeviceRef.current, status: statusRef.current, time: new Date().toLocaleTimeString("id-ID") },
        ...prev.slice(0, 49),
      ]);
    };

    await sendOne();

    // Then every 10 seconds
    autoInjectRef.current = setInterval(async () => {
      try {
        await sendOne();
      } catch (err) {
        console.error("Auto inject error:", err);
      }
    }, 10000);

    Swal.fire({
      icon: "success",
      title: "Auto Inject Dimulai! 🔴",
      html: `Data akan dikirim setiap <b>10 detik</b> ke <b>${selectedDevice}</b>.<br>Sensor asli di-<i>pause</i>. Tekan tombol lagi untuk berhenti.`,
      background: "var(--bg-secondary)",
      color: "var(--text-primary)",
      confirmButtonColor: "#ef4444",
      timer: 3000,
      timerProgressBar: true,
    });
  }, [isAutoInjecting, selectedDevice]);

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setWaterLevel(preset.values.water_level_cm.toString());
    setStatus(preset.values.status);
    setBatteryVoltage(preset.values.battery_voltage.toString());
    setSignalStrength(preset.values.signal_strength.toString());
  };

  const handleInject = async () => {
    if (!selectedDevice) {
      Swal.fire({
        icon: "warning",
        title: "Pilih Device!",
        text: "Silakan pilih device target terlebih dahulu.",
        background: "var(--bg-secondary)",
        color: "var(--text-primary)",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    setIsSending(true);

    try {
      const payload = {
        device_id: selectedDevice,
        water_level_cm: parseFloat(waterLevel),
        status: status,
        battery_voltage: parseFloat(batteryVoltage),
        signal_strength: parseInt(signalStrength),
        created_at: Date.now(),
      };

      await push(ref(database, "data"), payload);

      setHistory((prev) => [
        {
          device: selectedDevice,
          status: status,
          time: new Date().toLocaleTimeString("id-ID"),
        },
        ...prev.slice(0, 19), // Keep last 20
      ]);

      Swal.fire({
        icon: "success",
        title: "Data Terkirim! 🚀",
        html: `<div style="text-align:left; font-family: monospace; font-size: 13px; line-height: 1.8">
          <b>Device:</b> ${selectedDevice}<br>
          <b>Water Level:</b> ${waterLevel} cm<br>
          <b>Status:</b> ${status}<br>
          <b>Battery:</b> ${batteryVoltage} V<br>
          <b>Signal:</b> ${signalStrength}
        </div>`,
        background: "var(--bg-secondary)",
        color: "var(--text-primary)",
        confirmButtonColor: "#3b82f6",
        timer: 3000,
        timerProgressBar: true,
      });
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Gagal Mengirim!",
        text: err.message || "Terjadi kesalahan saat mengirim data.",
        background: "var(--bg-secondary)",
        color: "var(--text-primary)",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleBulkInject = async () => {
    if (!selectedDevice) {
      Swal.fire({ icon: "warning", title: "Pilih Device!", text: "Silakan pilih device target.", background: "var(--bg-secondary)", color: "var(--text-primary)", confirmButtonColor: "#3b82f6" });
      return;
    }

    const result = await Swal.fire({
      title: "Bulk Inject Data",
      html: `Kirim 10 data secara beruntun ke <b>${selectedDevice}</b> dengan variasi acak dari nilai saat ini?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Kirim 10 Data!",
      cancelButtonText: "Batal",
      background: "var(--bg-secondary)",
      color: "var(--text-primary)",
      confirmButtonColor: "#8b5cf6",
      cancelButtonColor: "#64748b",
    });

    if (!result.isConfirmed) return;

    setIsSending(true);
    const baseLevel = parseFloat(waterLevel);

    try {
      for (let i = 0; i < 10; i++) {
        const variation = (Math.random() - 0.5) * 2; // ±1cm variation
        const payload = {
          device_id: selectedDevice,
          water_level_cm: parseFloat((baseLevel + variation).toFixed(1)),
          status: status,
          battery_voltage: parseFloat((parseFloat(batteryVoltage) - i * 0.01).toFixed(2)),
          signal_strength: Math.max(0, parseInt(signalStrength) + Math.floor((Math.random() - 0.5) * 6)),
          created_at: Date.now() - (9 - i) * 60000, // 1 minute apart, oldest first
        };
        await push(ref(database, "data"), payload);
      }

      Swal.fire({
        icon: "success",
        title: "Bulk Inject Selesai! 🎉",
        text: `10 data berhasil dikirim ke ${selectedDevice}.`,
        background: "var(--bg-secondary)",
        color: "var(--text-primary)",
        confirmButtonColor: "#3b82f6",
      });
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "Gagal!", text: err.message, background: "var(--bg-secondary)", color: "var(--text-primary)", confirmButtonColor: "#ef4444" });
    } finally {
      setIsSending(false);
    }
  };

  if (devicesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-[var(--text-muted)] animate-shimmer p-8">Memuat...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]">
            <ShieldAlert size={22} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-[var(--text-primary)]">Admin Panel</h1>
            <p className="text-[var(--text-muted)] text-sm">
              ⚠️ Halaman rahasia — inject data sensor ke Firebase untuk demonstrasi
            </p>
          </div>
        </div>
        <div className="mt-3 px-4 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400 text-xs font-medium flex items-center gap-2">
          <AlertTriangle size={14} />
          Data yang di-inject akan langsung muncul di dashboard secara real-time. Gunakan dengan bijak!
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Device Selector */}
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--bg-glass-border)] p-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4 flex items-center gap-2">
              <Zap size={16} className="text-blue-500" /> Target Device
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {devices.map((device) => {
                const isSelected = selectedDevice === device.id;
                const deviceData = latestData[device.id];
                return (
                  <button
                    key={device.id}
                    onClick={() => setSelectedDevice(device.id)}
                    className={`text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                      isSelected
                        ? "border-blue-500 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                        : "border-[var(--bg-glass-border)] bg-[var(--bg-glass)] hover:border-[var(--text-muted)]"
                    }`}
                  >
                    <div className="font-bold text-sm text-[var(--text-primary)] truncate">{device.name}</div>
                    <div className="text-[10px] font-mono text-[var(--text-muted)] mt-0.5">{device.id}</div>
                    {deviceData && (
                      <div className={`text-[10px] font-semibold mt-2 px-2 py-0.5 rounded-full inline-block ${
                        deviceData.status.includes("AMAN") ? "bg-green-500/10 text-green-600 dark:text-green-500" :
                        deviceData.status.includes("KELEBIHAN") ? "bg-red-500/10 text-red-600 dark:text-red-500" :
                        "bg-amber-500/10 text-amber-600 dark:text-amber-500"
                      }`}>
                        {deviceData.status} • {deviceData.water_level_cm}cm
                      </div>
                    )}
                  </button>
                );
              })}
              {devices.length === 0 && (
                <div className="col-span-full text-center text-[var(--text-muted)] py-8">
                  Tidak ada device terdaftar. <Link href="/dashboard" className="text-blue-500 underline">Tambah device</Link> terlebih dahulu.
                </div>
              )}
            </div>
          </div>

          {/* Quick Presets */}
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--bg-glass-border)] p-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4 flex items-center gap-2">
              <Gauge size={16} className="text-purple-500" /> Quick Presets
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => applyPreset(preset)}
                  className={`text-left p-4 rounded-xl border ${preset.border} bg-[var(--bg-glass)] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]`}
                >
                  <div className="font-bold text-sm text-[var(--text-primary)]">{preset.name}</div>
                  <div className="text-[11px] text-[var(--text-muted)] mt-1 leading-snug">{preset.description}</div>
                  <div className="text-[10px] font-mono text-[var(--text-secondary)] mt-2">
                    💧 {preset.values.water_level_cm}cm • 🔋 {preset.values.battery_voltage}V • 📡 {preset.values.signal_strength}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Manual Controls */}
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--bg-glass-border)] p-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4 flex items-center gap-2">
              <Droplets size={16} className="text-cyan-500" /> Sensor Values
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Water Level */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
                  <Droplets size={13} className="text-blue-500" /> Water Level (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={waterLevel}
                  onChange={(e) => setWaterLevel(e.target.value)}
                  className="w-full px-4 py-3 bg-[var(--bg-glass)] border border-[var(--bg-glass-border)] rounded-xl text-[var(--text-primary)] font-mono text-lg font-bold focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 outline-none transition-all"
                />
                <input
                  type="range"
                  min="-10"
                  max="15"
                  step="0.1"
                  value={waterLevel}
                  onChange={(e) => setWaterLevel(e.target.value)}
                  className="w-full accent-blue-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-[var(--text-muted)]">
                  <span>-10 cm</span>
                  <span className="text-blue-500 font-bold">{waterLevel} cm</span>
                  <span>+15 cm</span>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
                  <AlertTriangle size={13} className="text-amber-500" /> Status
                </label>
                <div className="space-y-2">
                  {["AMAN", "KEKERINGAN", "KELEBIHAN"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus(s)}
                      className={`w-full px-4 py-3 rounded-xl border-2 text-left font-bold text-sm transition-all duration-200 ${
                        status === s
                          ? s === "AMAN"
                            ? "border-green-500 bg-green-500/10 text-green-600 dark:text-green-500"
                            : s === "KEKERINGAN"
                            ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-500"
                            : "border-red-500 bg-red-500/10 text-red-600 dark:text-red-500"
                          : "border-[var(--bg-glass-border)] bg-[var(--bg-glass)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]"
                      }`}
                    >
                      {s === "AMAN" && "✅ "}{s === "KEKERINGAN" && "⚠️ "}{s === "KELEBIHAN" && "🔴 "}
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Battery Voltage */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
                  <Battery size={13} className="text-green-500" /> Battery Voltage (V)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={batteryVoltage}
                  onChange={(e) => setBatteryVoltage(e.target.value)}
                  className="w-full px-4 py-3 bg-[var(--bg-glass)] border border-[var(--bg-glass-border)] rounded-xl text-[var(--text-primary)] font-mono text-lg font-bold focus:border-green-500 focus:ring-1 focus:ring-green-500/30 outline-none transition-all"
                />
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.1"
                  value={batteryVoltage}
                  onChange={(e) => setBatteryVoltage(e.target.value)}
                  className="w-full accent-green-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-[var(--text-muted)]">
                  <span>0V (Mati)</span>
                  <span className="text-green-500 font-bold">{batteryVoltage}V</span>
                  <span>5V (Penuh)</span>
                </div>
              </div>

              {/* Signal Strength */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
                    <SignalIcon size={13} className="text-purple-500" /> Signal Strength
                  </label>
                  <button
                    onClick={() => {
                      setRandomSignal(!randomSignal);
                      if (!randomSignal) {
                        lastRandomSignalRef.current = parseInt(signalStrength) || 22;
                      }
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                      randomSignal
                        ? "bg-purple-500/20 text-purple-500 border border-purple-500/30"
                        : "bg-[var(--bg-glass)] text-[var(--text-muted)] border border-[var(--bg-glass-border)] hover:text-[var(--text-secondary)]"
                    }`}
                  >
                    <Shuffle size={11} />
                    {randomSignal ? "Random ON" : "Random"}
                  </button>
                </div>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="31"
                  value={signalStrength}
                  onChange={(e) => setSignalStrength(e.target.value)}
                  disabled={randomSignal}
                  className={`w-full px-4 py-3 bg-[var(--bg-glass)] border border-[var(--bg-glass-border)] rounded-xl text-[var(--text-primary)] font-mono text-lg font-bold focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 outline-none transition-all ${randomSignal ? "opacity-50" : ""}`}
                />
                <input
                  type="range"
                  min="0"
                  max="31"
                  step="1"
                  value={signalStrength}
                  onChange={(e) => setSignalStrength(e.target.value)}
                  disabled={randomSignal}
                  className={`w-full accent-purple-500 cursor-pointer ${randomSignal ? "opacity-50" : ""}`}
                />
                <div className="flex justify-between text-[10px] font-mono text-[var(--text-muted)]">
                  <span>0 (Hilang)</span>
                  <span className="text-purple-500 font-bold">
                    {signalStrength}{randomSignal ? " 🎲" : ""}
                  </span>
                  <span>31 (Kuat)</span>
                </div>
                {randomSignal && (
                  <div className="text-[10px] text-purple-400 italic">
                    Acak otomatis rentang 15–28, bergerak halus ±1–2 per kirim
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 mt-6 pt-6 border-t border-[var(--bg-glass-border)]">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleInject}
                  disabled={isSending || isAutoInjecting || !selectedDevice}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-sm hover:shadow-[0_0_25px_rgba(59,130,246,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  {isSending ? (
                    <RotateCcw size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                  {isSending ? "Mengirim..." : "Inject 1 Data"}
                </button>
                <button
                  onClick={handleBulkInject}
                  disabled={isSending || isAutoInjecting || !selectedDevice}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-sm hover:shadow-[0_0_25px_rgba(139,92,246,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  <Zap size={18} />
                  Bulk Inject (10 Data)
                </button>
              </div>

              {/* Auto Inject / Streaming Button */}
              <button
                onClick={handleAutoInject}
                disabled={!selectedDevice && !isAutoInjecting}
                className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-sm transition-all active:scale-[0.98] ${
                  isAutoInjecting
                    ? "bg-gradient-to-r from-red-600 to-rose-600 text-white hover:shadow-[0_0_25px_rgba(239,68,68,0.5)] animate-pulse"
                    : "bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
                }`}
              >
                {isAutoInjecting ? (
                  <>
                    <Square size={18} className="fill-current" />
                    <span>Stop Auto Inject</span>
                    <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                      {autoInjectCount} terkirim
                    </span>
                  </>
                ) : (
                  <>
                    <Play size={18} className="fill-current" />
                    Auto Inject (tiap 10 detik) + Pause Sensor
                  </>
                )}
              </button>
              {isAutoInjecting && (
                <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-medium">
                  <Radio size={14} className="animate-pulse" />
                  <span>LIVE — mengirim data ke <b>{autoInjectDeviceRef.current}</b> setiap 10 detik. Sensor asli di-pause.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Preview & History */}
        <div className="space-y-6">
          {/* Live Preview Card */}
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--bg-glass-border)] p-6 sticky top-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4">
              📡 Live Preview
            </h2>
            <div className="bg-[var(--bg-glass)] rounded-xl p-5 border border-[var(--bg-glass-border)] space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-[var(--text-primary)]">
                    {selectedDevice ? devices.find(d => d.id === selectedDevice)?.name || selectedDevice : "Belum dipilih"}
                  </div>
                  <div className="text-[10px] font-mono text-[var(--text-muted)]">{selectedDevice || "—"}</div>
                </div>
                <div className={`w-3 h-3 rounded-full ${selectedDevice ? "bg-green-500 animate-pulse" : "bg-[var(--text-muted)]"}`} />
              </div>

              <div className="text-center py-4">
                <div className={`text-4xl font-black font-mono tracking-tighter ${
                  status === "AMAN" ? "text-green-600 dark:text-green-500" :
                  status === "KEKERINGAN" ? "text-amber-600 dark:text-amber-500" :
                  "text-red-600 dark:text-red-500"
                }`}>
                  {parseFloat(waterLevel) >= 0 ? "+" : ""}{parseFloat(waterLevel).toFixed(1)}
                  <span className="text-sm font-normal text-[var(--text-secondary)] ml-1">cm</span>
                </div>
                <div className={`text-xs font-bold mt-2 uppercase tracking-widest ${
                  status === "AMAN" ? "text-green-600 dark:text-green-500" :
                  status === "KEKERINGAN" ? "text-amber-600 dark:text-amber-500" :
                  "text-red-600 dark:text-red-500"
                }`}>
                  • {status}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-[var(--bg-secondary)] rounded-lg p-3 text-center">
                  <div className="text-[var(--text-muted)] mb-1">🔋 Battery</div>
                  <div className="font-bold font-mono text-[var(--text-primary)]">{batteryVoltage}V</div>
                </div>
                <div className="bg-[var(--bg-secondary)] rounded-lg p-3 text-center">
                  <div className="text-[var(--text-muted)] mb-1">📡 Signal</div>
                  <div className="font-bold font-mono text-[var(--text-primary)]">{signalStrength}</div>
                </div>
              </div>
            </div>

            {/* Injection History */}
            {history.length > 0 && (
              <div className="mt-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">
                  📋 Riwayat Inject ({history.length})
                </h3>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {history.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-xs bg-[var(--bg-glass)] rounded-lg px-3 py-2 border border-[var(--bg-glass-border)]"
                    >
                      {item.status === "AMAN" ? (
                        <CheckCircle size={12} className="text-green-500 shrink-0" />
                      ) : item.status === "KEKERINGAN" ? (
                        <AlertTriangle size={12} className="text-amber-500 shrink-0" />
                      ) : (
                        <XCircle size={12} className="text-red-500 shrink-0" />
                      )}
                      <span className="font-mono text-[var(--text-primary)] truncate">{item.device}</span>
                      <span className="ml-auto text-[var(--text-muted)] shrink-0">{item.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
