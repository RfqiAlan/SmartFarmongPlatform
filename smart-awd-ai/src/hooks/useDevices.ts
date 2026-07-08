"use client";

import { useState, useEffect } from "react";
import { database } from "@/lib/firebase";
import { ref, onValue, update, remove, get } from "firebase/database";

export interface Device {
  id: string;
  name: string;
  lat?: number;
  lng?: number;
  added_at: string;
}

export function useDevices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const devicesRef = ref(database, "devices");
    const unsubscribe = onValue(devicesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const parsedDevices = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setDevices(parsedDevices);
      } else {
        setDevices([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addDevice = async (id: string, name: string, lat?: number, lng?: number) => {
    const deviceRef = ref(database, `devices/${id}`);
    const snapshot = await get(deviceRef);
    
    if (snapshot.exists()) {
      throw new Error(`Device ID "${id}" sudah terdaftar!`);
    }

    await update(ref(database), {
      [`devices/${id}`]: {
        name,
        lat: lat || null,
        lng: lng || null,
        added_at: new Date().toISOString(),
      }
    });
  };

  const removeDevice = async (id: string) => {
    await remove(ref(database, `devices/${id}`));
  };

  return { devices, loading, addDevice, removeDevice };
}
