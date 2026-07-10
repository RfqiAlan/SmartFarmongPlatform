"use client";

import { useState, useEffect } from "react";
import { database } from "@/lib/firebase";
import { ref, onValue, update } from "firebase/database";

export interface CalibrationConfig {
  calibration_mode: boolean;
  offset_cm: number;
}

const DEFAULT_CONFIG: CalibrationConfig = {
  calibration_mode: false,
  offset_cm: 0,
};

export function useCalibrationConfig(deviceId: string) {
  const [config, setConfig] = useState<CalibrationConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const configRef = ref(database, `config/${deviceId}`);
    const unsubscribe = onValue(configRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setConfig({
          calibration_mode: data.calibration_mode ?? false,
          offset_cm: data.offset_cm ?? 0,
        });
      } else {
        setConfig(DEFAULT_CONFIG);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [deviceId]);

  const setCalibrationMode = async (enabled: boolean) => {
    setSaving(true);
    try {
      await update(ref(database, `config/${deviceId}`), {
        calibration_mode: enabled,
      });
    } catch (err) {
      console.error("Failed to update calibration mode:", err);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const setCalibrationOffset = async (offset: number) => {
    setSaving(true);
    try {
      await update(ref(database, `config/${deviceId}`), {
        offset_cm: offset,
      });
    } catch (err) {
      console.error("Failed to update calibration offset:", err);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  return { config, loading, saving, setCalibrationMode, setCalibrationOffset };
}
