export interface WeatherForecast {
  date: string;
  precipitation_sum: number; // in mm
  weathercode: number;
  temperature_max: number;
  temperature_min: number;
  sunrise: string;
  sunset: string;
  sunshine_duration: number; // in seconds
}

export interface CurrentWeather {
  temperature: number;
  windspeed: number;
  weathercode: number;
  is_day: number;
  time: string;
}

/**
 * Fetches the next 3 days of precipitation forecast using Open-Meteo API (Free)
 */
export async function fetchWeatherForecast(lat: number, lng: number): Promise<WeatherForecast[]> {
  if (lat === undefined || lng === undefined || isNaN(Number(lat)) || isNaN(Number(lng))) return [];
  
  return new Promise((resolve) => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=precipitation_sum,weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset,sunshine_duration&timezone=auto&forecast_days=3`;
    
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (!data.daily || !data.daily.time || !data.daily.precipitation_sum) {
            resolve([]);
            return;
          }
          
          const forecasts: WeatherForecast[] = [];
          for (let i = 0; i < data.daily.time.length; i++) {
            forecasts.push({
              date: data.daily.time[i],
              precipitation_sum: data.daily.precipitation_sum[i] || 0,
              weathercode: data.daily.weathercode?.[i] || 0,
              temperature_max: data.daily.temperature_2m_max?.[i] || 0,
              temperature_min: data.daily.temperature_2m_min?.[i] || 0,
              sunrise: data.daily.sunrise?.[i] || "",
              sunset: data.daily.sunset?.[i] || "",
              sunshine_duration: data.daily.sunshine_duration?.[i] || 0,
            });
          }
          resolve(forecasts);
        } catch (e) {
          resolve([]);
        }
      } else {
        resolve([]);
      }
    };
    
    xhr.onerror = () => {
      console.warn("Network error or adblocker prevented fetch.");
      resolve([]);
    };
    
    xhr.send();
  });
}

/**
 * Fetches current weather data for the given location using Open-Meteo API
 */
export async function fetchCurrentWeather(lat: number, lng: number): Promise<CurrentWeather | null> {
  if (lat === undefined || lng === undefined || isNaN(Number(lat)) || isNaN(Number(lng))) return null;

  return new Promise((resolve) => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&timezone=auto`;
    
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (data.current_weather) {
            resolve(data.current_weather as CurrentWeather);
          } else {
            resolve(null);
          }
        } catch (e) {
          resolve(null);
        }
      } else {
        resolve(null);
      }
    };
    
    xhr.onerror = () => {
      console.warn("Network error or adblocker prevented fetch.");
      resolve(null);
    };
    
    xhr.send();
  });
}
