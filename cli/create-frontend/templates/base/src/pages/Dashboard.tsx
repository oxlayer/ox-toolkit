/**
 * Pages - Dashboard (Weather App)
 */

import { useWeather, useForecast } from '../hooks'
import { useState } from 'react'

export function Dashboard() {
  const [city, setCity] = useState('London')

  // London coordinates
  const lat = 51.5074
  const lon = -0.1278

  const { data: weatherResponse, isLoading: weatherLoading, error: weatherError } = useWeather({ lat, lon })
  const { data: forecastResponse, isLoading: forecastLoading } = useForecast({ lat, lon })

  const weather = weatherResponse?.data
  const forecast = forecastResponse?.data

  const getWeatherIcon = (code: number): string => {
    // Open-Meteo weather codes: https://open-meteo.com/en/docs
    if (code === 0 || code === 1) return '☀️' // Clear/Mainly clear
    if (code === 2 || code === 3) return '☁️' // Partly cloudy/Overcast
    if (code >= 45 && code <= 48) return '🌫️' // Fog
    if (code >= 51 && code <= 57) return '🌧️' // Drizzle
    if (code >= 61 && code <= 67) return '🌧️' // Rain
    if (code >= 71 && code <= 77) return '❄️' // Snow
    if (code >= 80 && code <= 82) return '🌧️' // Rain showers
    if (code >= 85 && code <= 86) return '❄️' // Snow showers
    if (code >= 95) return '⛈️' // Thunderstorm
    return '🌤️'
  }

  const getWeatherDescription = (code: number): string => {
    const codes: Record<number, string> = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Foggy',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      71: 'Slight snow',
      73: 'Moderate snow',
      75: 'Heavy snow',
      77: 'Snow grains',
      80: 'Slight rain showers',
      81: 'Moderate rain showers',
      82: 'Violent rain showers',
      85: 'Slight snow showers',
      86: 'Moderate snow showers',
      95: 'Thunderstorm',
    }
    return codes[code] || 'Unknown'
  }

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const loading = weatherLoading || forecastLoading

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {getWeatherIcon('Clear')} Weather App
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Current weather in {city}
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading weather data...</p>
          </div>
        )}

        {/* Error State */}
        {weatherError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-800 dark:text-red-400">
              Error: {weatherError.message || 'Failed to load weather'}
            </p>
          </div>
        )}

        {/* Weather Display */}
        {!loading && weather && (
          <div className="space-y-6">
            {/* Current Weather Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{city}</h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    {getWeatherDescription(weather.current.weather_code)}
                  </p>
                </div>
                <div className="text-6xl">
                  {getWeatherIcon(weather.current.weather_code)}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Temperature</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {Math.round(weather.current.temperature_2m)}°C
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Humidity</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {weather.current.relative_humidity_2m}%
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Wind Speed</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {Math.round(weather.current.wind_speed_10m)} km/h
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Condition</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {getWeatherIcon(weather.current.weather_code)}
                  </p>
                </div>
              </div>
            </div>

            {/* Forecast Card */}
            {forecast && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  5-Day Forecast
                </h3>
                <div className="grid grid-cols-5 gap-3">
                  {forecast.daily.time.slice(0, 5).map((date: string, index: number) => (
                    <div
                      key={date}
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center"
                    >
                      <p className="text-gray-600 dark:text-gray-400 text-xs mb-2">
                        {formatDate(date)}
                      </p>
                      <div className="text-3xl mb-2">
                        {getWeatherIcon(forecast.daily.weather_code[index])}
                      </div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {Math.round(forecast.daily.temperature_2m_max[index])}°
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {Math.round(forecast.daily.temperature_2m_min[index])}°
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
