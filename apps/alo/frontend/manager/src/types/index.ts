/**
 * Types
 */

export interface Weather {
  name: string
  main: {
    temp: number
    feels_like: number
    humidity: number
  }
  weather: Array<{
    main: string
    description: string
  }>
  wind: {
    speed: number
  }
}

export interface ForecastDay {
  date: string
  temp_min: number
  temp_max: number
  weather: string
}
