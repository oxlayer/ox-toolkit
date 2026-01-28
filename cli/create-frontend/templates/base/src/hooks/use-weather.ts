/**
 * useWeather Hook
 */

import { useQuery } from '@tanstack/react-query'
import { weatherApi } from '../services/api'

interface Coordinates {
  lat: number
  lon: number
}

export function useWeather({ lat, lon }: Coordinates) {
  return useQuery({
    queryKey: ['weather', lat, lon],
    queryFn: () => weatherApi.getCurrentWeather(lat, lon),
    enabled: !!lat && !!lon,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useForecast({ lat, lon }: Coordinates) {
  return useQuery({
    queryKey: ['forecast', lat, lon],
    queryFn: () => weatherApi.getForecast(lat, lon),
    enabled: !!lat && !!lon,
    staleTime: 15 * 60 * 1000, // 15 minutes
  })
}
