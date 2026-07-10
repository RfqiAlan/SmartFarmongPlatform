"use client";

import { useState } from "react";
import { useCalibrationConfig } from "@/hooks/useCalibrationConfig";
import { Settings2, Zap, Clock, AlertTriangle } from "lucide-react";

export default function CalibrationPanel({ deviceId }: { deviceId: string }) {
  const { config, loading, saving, setCalibrationMode, setCalibrationOffset } =
    useCalibrationConfig(deviceId);
  const [offsetInput, setOffsetInput] = useState<string | null>(null);
  const [error, setError] = useState("");

  if (loading) {
    return (
      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--bg-glass-border)] p-6 animate-shimmer">
        <div className="h-6 w-48 bg-[var(--bg-glass)] rounded mb-4"></div>
        <div className="h-20 bg-[var(--bg-glass)] rounded-xl"></div>
      </div>
    );
  }

  const handleToggle = async () => {
    setError("");
    try {
      await setCalibrationMode(!config.calibration_mode);
    } catch {
      setError("Gagal mengubah mode kalibrasi. Periksa koneksi.");
    }
  };

  const handleOffsetSave = async () => {
    if (offsetInput === null) return;
    setError("");
    const val = parseFloat(offsetInput);
    if (isNaN(val)) {
      setError("Offset harus berupa angka.");
      return;
    }
    try {
      await setCalibrationOffset(val);
      setOffsetInput(null);
    } catch {
      setError("Gagal menyimpan offset. Periksa koneksi.");
    }
  };

  const displayOffset =
    offsetInput !== null ? offsetInput : config.offset_cm.toString();

  return (
    <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--bg-glass-border)] p-6 relative overflow-hidden">
      {/* Top accent bar */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 transition-colors duration-500 ${
          config.calibration_mode
            ? "bg-gradient-to-r from-amber-500 to-orange-500"
            : "bg-gradient-to-r from-slate-600 to-slate-500"
        }`}
      ></div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-300 ${
              config.calibration_mode
                ? "bg-amber-500/20 text-amber-500"
                : "bg-[var(--bg-glass)] text-[var(--text-muted)]"
            }`}
          >
            <Settings2 size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">
              Mode Kalibrasi
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Kontrol interval pengiriman data sensor
            </p>
          </div>
        </div>

        {/* Toggle Switch */}
        <button
          onClick={handleToggle}
          disabled={saving}
          className={`relative w-14 h-7 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-card)] ${
            config.calibration_mode
              ? "bg-amber-500 focus:ring-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.4)]"
              : "bg-[var(--bg-glass-border)] focus:ring-blue-500"
          } ${saving ? "opacity-60 cursor-wait" : "cursor-pointer"}`}
          aria-label="Toggle calibration mode"
        >
          <span
            className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${
              config.calibration_mode ? "translate-x-7" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Current Mode Info */}
        <div
          className={`rounded-xl p-4 border transition-all duration-300 ${
            config.calibration_mode
              ? "bg-amber-500/5 border-amber-500/20"
              : "bg-[var(--bg-glass)] border-[var(--bg-glass-border)]"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            {config.calibration_mode ? (
              <Zap size={16} className="text-amber-500" />
            ) : (
              <Clock size={16} className="text-blue-500" />
            )}
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Interval Saat Ini
            </span>
          </div>
          <div
            className={`text-2xl font-black font-mono ${
              config.calibration_mode
                ? "text-amber-500"
                : "text-[var(--text-primary)]"
            }`}
          >
            {config.calibration_mode ? "5 detik" : "3 jam"}
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            {config.calibration_mode
              ? "Data sensor dikirim setiap 5 detik untuk kalibrasi"
              : "Mode hemat daya — data dikirim setiap 3 jam"}
          </p>
        </div>

        {/* Offset Input */}
        <div className="bg-[var(--bg-glass)] rounded-xl p-4 border border-[var(--bg-glass-border)]">
          <div className="flex items-center gap-2 mb-2">
            <Settings2 size={16} className="text-purple-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Offset Kalibrasi
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.1"
              value={displayOffset}
              onChange={(e) => setOffsetInput(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--bg-glass-border)] rounded-lg text-[var(--text-primary)] font-mono text-lg focus:border-purple-500 outline-none transition-colors"
              placeholder="0.0"
            />
            <span className="text-sm text-[var(--text-secondary)] font-medium whitespace-nowrap">
              cm
            </span>
          </div>
          {offsetInput !== null && (
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleOffsetSave}
                disabled={saving}
                className="flex-1 px-3 py-1.5 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
              <button
                onClick={() => setOffsetInput(null)}
                className="px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                Batal
              </button>
            </div>
          )}
          <p className="text-xs text-[var(--text-muted)] mt-2">
            Tambah/kurangi pembacaan sensor (+ atau -)
          </p>
        </div>
      </div>

      {/* Warning when calibration is active */}
      {config.calibration_mode && (
        <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm animate-fade-in-up">
          <AlertTriangle
            size={18}
            className="text-amber-500 mt-0.5 shrink-0"
          />
          <div>
            <span className="font-semibold text-amber-500">
              Mode Kalibrasi Aktif
            </span>
            <p className="text-[var(--text-secondary)] text-xs mt-0.5">
              Konsumsi daya meningkat drastis. Matikan setelah kalibrasi selesai
              agar baterai tidak cepat habis.
            </p>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </div>
      )}
    </div>
  );
}
