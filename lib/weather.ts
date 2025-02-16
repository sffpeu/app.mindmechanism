import { WeatherData, MoonData, LocationData } from './diary';

const WEATHER_API_KEY = process.env.NEXT_PUBLIC_WEATHER_API_KEY || '6cb652a81cb64a19a84103447252001';

interface WeatherAPIResponse {
  location: {
    name: string;
    region: string;
    country: string;
    lat: number;
    lon: number;
    tz_id: string;
    localtime: string;
  };
  current: {
    temp_c: number;
    condition: {
      text: string;
      icon: string;
    };
    humidity: number;
    uv: number;
    pressure_mb: number;
    wind_kph: number;
    wind_dir: string;
  };
}

interface AstronomyAPIResponse {
  astronomy: {
    astro: {
      moon_phase: string;
      moon_illumination: string;
      moonrise: string;
      moonset: string;
    };
  };
}

export async function getCurrentLocation(): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve, reject) => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          reject(new Error('Unable to get your location. Using IP-based location instead.'));
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      reject(new Error('Geolocation is not supported by your browser. Using IP-based location instead.'));
    }
  });
}

export async function getWeatherAndLocation(
  coordinates?: { lat: number; lon: number }
): Promise<{ weather: WeatherData; location: LocationData }> {
  try {
    const query = coordinates ? `${coordinates.lat},${coordinates.lon}` : 'auto:ip';
    const response = await fetch(
      `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${query}&aqi=no`
    );

    if (!response.ok) {
      throw new Error('Weather API request failed');
    }

    const data: WeatherAPIResponse = await response.json();

    return {
      weather: {
        temperature: data.current.temp_c,
        humidity: data.current.humidity,
        uvIndex: data.current.uv,
        airPressure: data.current.pressure_mb,
        wind: {
          speed: data.current.wind_kph,
          direction: data.current.wind_dir
        }
      },
      location: {
        latitude: data.location.lat,
        longitude: data.location.lon,
        city: data.location.name,
        country: data.location.country
      }
    };
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw error;
  }
}

export async function getMoonData(
  coordinates?: { lat: number; lon: number }
): Promise<MoonData> {
  try {
    const query = coordinates ? `${coordinates.lat},${coordinates.lon}` : 'auto:ip';
    const response = await fetch(
      `https://api.weatherapi.com/v1/astronomy.json?key=${WEATHER_API_KEY}&q=${query}`
    );

    if (!response.ok) {
      throw new Error('Astronomy API request failed');
    }

    const data: AstronomyAPIResponse = await response.json();
    const { astro } = data.astronomy;

    return {
      phase: astro.moon_phase,
      illumination: parseInt(astro.moon_illumination),
      moonrise: astro.moonrise,
      moonset: astro.moonset
    };
  } catch (error) {
    console.error('Error fetching moon data:', error);
    throw error;
  }
} 