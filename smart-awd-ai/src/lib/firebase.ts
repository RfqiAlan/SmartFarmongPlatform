import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  // Config for water-monitoring-iot-9046e
  databaseURL: "https://water-monitoring-iot-9046e-default-rtdb.asia-southeast1.firebasedatabase.app",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const database = getDatabase(app);

export { app, database };
