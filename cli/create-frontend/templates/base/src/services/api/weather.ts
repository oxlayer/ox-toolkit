/**
 * API Client
 */

import axios from 'axios'

const API_BASE_URL = 'https://api.open-meteo.com'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Weather API
 */
export const weatherApi = {
  getCurrentWeather: (lat: number, lon: number) =>
    apiClient.get('/v1/forecast', {
      params: {
        latitude: lat,
        longitude: lon,
        current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m',
        timezone: 'auto',
      },
    }),

  getForecast: (lat: number, lon: number) =>
    apiClient.get('/v1/forecast', {
      params: {
        latitude: lat,
        longitude: lon,
        daily: 'weather_code,temperature_2m_max,temperature_2m_min',
        timezone: 'auto',
      },
    }),
}
