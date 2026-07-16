"use client";

import { useState, useEffect } from "react";
import { database } from "@/lib/firebase";
import { ref, query, orderByChild, limitToLast, onValue } from "firebase/database";
import { getAdminOverrideDevices } from "./useAdminOverride";

export interface SensorData {
  id: string;
  device_id: string;
  water_level_cm: number;
  battery_voltage: number;
  signal_strength: number;
  status: string;
  created_at: number | string;
  _source?: string;
}

export function useFirebaseData(deviceId?: string, limit: number = 100) {
  const [data, setData] = useState<SensorData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Note: since we share a single `/data` node for all devices right now,
    // we fetch the last N items and then filter by device_id locally.
    // In production with huge data, this should be restructured to `/data/{device_id}`.
    const dataRef = query(ref(database, "data"), orderByChild("created_at"), limitToLast(limit));
    
    const unsubscribe = onValue(dataRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        const parsed = Object.keys(val).map((key) => ({
          id: key,
          ...val[key],
        })) as SensorData[];
        
        // Sort ascending by time
        parsed.sort((a, b) => {
          const ta = typeof a.created_at === 'number' ? a.created_at : new Date(a.created_at).getTime();
          const tb = typeof b.created_at === 'number' ? b.created_at : new Date(b.created_at).getTime();
          return ta - tb;
        });

        // Filter if deviceId is provided
        const filtered = deviceId ? parsed.filter(d => d.device_id === deviceId) : parsed;

        // Admin override: hide real sensor data for devices in override mode
        const overrideDevices = getAdminOverrideDevices();
        const finalData = filtered.filter(d => {
          if (overrideDevices.includes(d.device_id)) {
            // Only show admin-injected data for overridden devices
            return d._source === "admin_auto";
          }
          return true;
        });

        setData(finalData);
      } else {
        setData([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [deviceId, limit]);

  return { data, loading };
}

// Hook specifically for overview page (gets latest 1 data per device)
export function useLatestDataForAllDevices() {
  const { data, loading } = useFirebaseData(undefined, 300); // fetch enough to hopefully get all devices' latest
  const [latestData, setLatestData] = useState<Record<string, SensorData>>({});

  useEffect(() => {
    const latest: Record<string, SensorData> = {};
    // Data is sorted oldest to newest, so the last one we see is the newest
    data.forEach(d => {
      latest[d.device_id] = d;
    });
    setLatestData(latest);
  }, [data]);

  return { latestData, loading };
}
