"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "smart_awd_admin_override";

/**
 * Get list of device IDs currently in admin override mode.
 * When a device is in override mode, only admin-injected data (_source: "admin_auto")
 * will be shown in the UI — real sensor data is hidden (not deleted).
 */
export function getAdminOverrideDevices(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setAdminOverride(deviceId: string) {
  const current = getAdminOverrideDevices();
  if (!current.includes(deviceId)) {
    current.push(deviceId);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  window.dispatchEvent(new Event("admin-override-change"));
}

export function clearAdminOverride(deviceId: string) {
  const current = getAdminOverrideDevices().filter(id => id !== deviceId);
  if (current.length === 0) {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  }
  window.dispatchEvent(new Event("admin-override-change"));
}

/**
 * React hook that reactively tracks which devices are in admin override mode.
 * Listens for changes from both the same tab and other tabs.
 */
export function useAdminOverride() {
  const [overrideDevices, setOverrideDevices] = useState<string[]>([]);

  const refresh = useCallback(() => {
    setOverrideDevices(getAdminOverrideDevices());
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener("admin-override-change", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("admin-override-change", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [refresh]);

  return overrideDevices;
}
