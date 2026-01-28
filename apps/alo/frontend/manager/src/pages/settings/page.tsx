/**
 * Settings Page - Working Hours Configuration
 */

import { useState } from 'react'
import { CardTech, FieldTech, LabelTech, InputTech, ButtonTech as TechButton } from '@acme/ui'
import type { WeeklyAvailability, TimeSlot, DayOfWeek } from '@/types'

const DAYS: { value: DayOfWeek; label: string }[] = [
  { value: 'monday', label: 'Segunda-feira' },
  { value: 'tuesday', label: 'Terça-feira' },
  { value: 'wednesday', label: 'Quarta-feira' },
  { value: 'thursday', label: 'Quinta-feira' },
  { value: 'friday', label: 'Sexta-feira' },
  { value: 'saturday', label: 'Sábado' },
  { value: 'sunday', label: 'Domingo' },
]

const initialState: WeeklyAvailability[] = DAYS.map((day) => ({
  day: day.value,
  enabled: day.value !== 'sunday' && day.value !== 'saturday', // Weekdays enabled by default
  slots: day.value !== 'sunday' && day.value !== 'saturday'
    ? [{ start: '09:00', end: '18:00' }]
    : [],
}))

export default function SettingsPage() {
  const [schedule, setSchedule] = useState<WeeklyAvailability[]>(initialState)

  const toggleDay = (dayIndex: number) => {
    setSchedule((prev) => {
      const updated = [...prev]
      updated[dayIndex] = {
        ...updated[dayIndex],
        enabled: !updated[dayIndex].enabled,
        slots: !updated[dayIndex].enabled ? [{ start: '09:00', end: '18:00' }] : [],
      }
      return updated
    })
  }

  const updateSlot = (
    dayIndex: number,
    slotIndex: number,
    field: keyof TimeSlot,
    value: string
  ) => {
    setSchedule((prev) => {
      const updated = [...prev]
      const newSlots = [...updated[dayIndex].slots]
      newSlots[slotIndex] = { ...newSlots[slotIndex], [field]: value }
      updated[dayIndex] = { ...updated[dayIndex], slots: newSlots }
      return updated
    })
  }

  const addSlot = (dayIndex: number) => {
    setSchedule((prev) => {
      const updated = [...prev]
      const newSlots = [...updated[dayIndex].slots, { start: '09:00', end: '18:00' }]
      updated[dayIndex] = { ...updated[dayIndex], slots: newSlots }
      return updated
    })
  }

  const removeSlot = (dayIndex: number, slotIndex: number) => {
    setSchedule((prev) => {
      const updated = [...prev]
      const newSlots = updated[dayIndex].slots.filter((_, i) => i !== slotIndex)
      updated[dayIndex] = { ...updated[dayIndex], slots: newSlots }
      return updated
    })
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Working hours schedule:', schedule)
    // TODO: Save to API
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configurações</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Configure seus horários de funcionamento.
        </p>
      </div>

      <CardTech className="p-6">
        <form onSubmit={handleSave} className="space-y-6">
          {schedule.map((daySchedule, dayIndex) => {
            const dayInfo = DAYS[dayIndex]

            return (
              <div key={daySchedule.day} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-0 last:pb-0">
                {/* Day Toggle */}
                <div className="flex items-center justify-between mb-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={daySchedule.enabled}
                      onChange={() => toggleDay(dayIndex)}
                      className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <span className="text-lg font-medium text-gray-900 dark:text-white">
                      {dayInfo.label}
                    </span>
                  </label>

                  {daySchedule.enabled && daySchedule.slots.length < 3 && (
                    <TechButton
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addSlot(dayIndex)}
                    >
                      + Horário
                    </TechButton>
                  )}
                </div>

                {/* Time Slots */}
                {daySchedule.enabled && (
                  <div className="space-y-3 ml-8">
                    {daySchedule.slots.map((slot, slotIndex) => (
                      <div key={slotIndex} className="flex items-center gap-3">
                        <FieldTech className="flex-1">
                          <LabelTech htmlFor={`start-${dayIndex}-${slotIndex}`}>Início</LabelTech>
                          <InputTech
                            id={`start-${dayIndex}-${slotIndex}`}
                            type="time"
                            value={slot.start}
                            onChange={(e) => updateSlot(dayIndex, slotIndex, 'start', e.target.value)}
                            required
                          />
                        </FieldTech>

                        <span className="text-gray-500 dark:text-gray-400 pt-6">até</span>

                        <FieldTech className="flex-1">
                          <LabelTech htmlFor={`end-${dayIndex}-${slotIndex}`}>Fim</LabelTech>
                          <InputTech
                            id={`end-${dayIndex}-${slotIndex}`}
                            type="time"
                            value={slot.end}
                            onChange={(e) => updateSlot(dayIndex, slotIndex, 'end', e.target.value)}
                            required
                          />
                        </FieldTech>

                        {daySchedule.slots.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSlot(dayIndex, slotIndex)}
                            className="pt-6 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            aria-label="Remove time slot"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <TechButton
              type="submit"
              variant="solid"
            >
              Salvar Horários
            </TechButton>
          </div>
        </form>
      </CardTech>
    </div>
  )
}
