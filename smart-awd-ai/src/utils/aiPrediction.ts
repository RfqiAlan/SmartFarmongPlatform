import { SensorData } from "@/hooks/useFirebaseData";
import { WeatherForecast } from "./weatherApi";

export interface PredictionResult {
  predictedLevels: {
    date: string;
    level: number;
    precipitation: number;
  }[];
  trendSlope: number; // cm per hour
  recommendation: string;
  status: "AMAN" | "PERINGATAN" | "KRITIS";
}

/**
 * Calculates the linear trend of water level changes (cm/hour)
 * Uses simple linear regression over the past 24 hours of data.
 */
export function calculateTrend(data: SensorData[]): number {
  if (data.length < 2) return 0;
  
  // Only use data from the last 24 hours to get current trend
  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;
  
  const recentData = data.filter(d => {
    const t = typeof d.created_at === 'number' ? d.created_at : new Date(d.created_at).getTime();
    return t >= dayAgo;
  });

  const dataset = recentData.length > 2 ? recentData : data.slice(-10); // fallback if not enough data
  
  if (dataset.length < 2) return 0;

  // Simple Linear Regression: y = mx + b
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  const n = dataset.length;
  
  const firstTime = typeof dataset[0].created_at === 'number' 
    ? dataset[0].created_at 
    : new Date(dataset[0].created_at).getTime();

  for (let i = 0; i < n; i++) {
    const timeMs = typeof dataset[i].created_at === 'number' 
      ? (dataset[i].created_at as number)
      : new Date(dataset[i].created_at).getTime();
    
    const x = (timeMs - firstTime) / (1000 * 60 * 60); // hours since first point
    const y = parseFloat(dataset[i].water_level_cm.toString());
    
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  }
  
  const denominator = (n * sumX2 - sumX * sumX);
  if (denominator === 0) return 0; // Prevent division by zero
  
  let slope = (n * sumXY - sumX * sumY) / denominator;
  
  // Clamp slope to realistic limits for a rice field (-2cm to +2cm per hour)
  // This prevents wild predictions if test data is entered in rapid bursts (e.g. 5 data points in 10 seconds)
  slope = Math.max(-2, Math.min(2, slope));
  
  return slope;
}

/**
 * Predicts water levels for the next 3 days based on trend and weather forecast.
 * Heuristic: 1mm of rain roughly adds 0.5cm of water level to the field (adjustable).
 */
export function predictFutureWaterLevel(
  currentLevel: number, 
  trendSlopePerHour: number, 
  forecasts: WeatherForecast[]
): PredictionResult {
  const RAIN_IMPACT_FACTOR = 0.5; // 1mm rain = 0.5cm water level increase
  
  const predictedLevels = [];
  let currentPredictedLevel = currentLevel;
  let hasCritical = false;
  let hasWarning = false;

  for (let i = 0; i < forecasts.length; i++) {
    const f = forecasts[i];
    
    // Base change from natural trend over 24 hours
    const trendChange = trendSlopePerHour * 24; 
    
    // Change from rain
    const rainChange = f.precipitation_sum * RAIN_IMPACT_FACTOR;
    
    // We assume water drains out or evaporates based on trend, and rain adds to it.
    // If trend is positive (filling), we cap it so it doesn't predict infinite floods if not raining.
    // Usually fields drain, so trend is negative.
    
    currentPredictedLevel = currentPredictedLevel + trendChange + rainChange;
    
    predictedLevels.push({
      date: f.date,
      level: currentPredictedLevel,
      precipitation: f.precipitation_sum
    });

    if (currentPredictedLevel < -10 || currentPredictedLevel > 15) {
      hasCritical = true;
    } else if (currentPredictedLevel < -5 || currentPredictedLevel > 10) {
      hasWarning = true;
    }
  }

  let status: "AMAN" | "PERINGATAN" | "KRITIS" = "AMAN";
  if (hasCritical) status = "KRITIS";
  else if (hasWarning) status = "PERINGATAN";

  // Generate Recommendation
  let recommendation = "Kondisi air diprediksi stabil. Tidak perlu tindakan khusus.";
  
  if (status === "KRITIS") {
    if (predictedLevels[predictedLevels.length - 1].level < -10) {
      recommendation = "Kritis! Air diprediksi surut parah di bawah batas minimum (-10cm). Segera jadwalkan pompa irigasi menyala.";
    } else {
      recommendation = "Kritis! Potensi banjir. Hujan deras diprediksi memicu air meluap. Pastikan saluran drainase terbuka.";
    }
  } else if (status === "PERINGATAN") {
    if (predictedLevels[predictedLevels.length - 1].level < -5) {
      recommendation = "Peringatan: Level air terus menyusut. Siapkan pompa irigasi dalam 2-3 hari ke depan jika tidak ada hujan deras.";
    } else {
      recommendation = "Peringatan: Level air cukup tinggi. Pantau saluran pembuangan agar tanaman tidak terendam berlebih.";
    }
  }

  return {
    predictedLevels,
    trendSlope: trendSlopePerHour,
    recommendation,
    status
  };
}
