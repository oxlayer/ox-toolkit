import { useState, useEffect, useRef } from 'react'

export interface AutocompleteOption {
  id: string
  name: string
  icon?: string
}

interface AutocompleteSelectProps {
  options: AutocompleteOption[]
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  error?: string
  emptyMessage?: string
  colorTheme?: 'purple' | 'blue'
  allowCustom?: boolean
  onCustomOption?: (customValue: string) => void
}

const AutocompleteSelect = ({
  options,
  value,
  onChange,
  label = 'Categoria',
  placeholder = 'Buscar...',
  error,
  emptyMessage = 'Nenhuma opção encontrada',
  colorTheme = 'purple',
  allowCustom = false,
  onCustomOption,
}: AutocompleteSelectProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [customValueName, setCustomValueName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(opt => opt.id === value)

  const filteredOptions = options.filter(option =>
    option.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const hasNoResults = searchQuery.trim() !== '' && filteredOptions.length === 0

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectOption = (optionId: string, optionName: string) => {
    onChange(optionId)
    setIsOpen(false)
    setSearchQuery('')
    setCustomValueName('')
  }

  const handleCreateCustomOption = () => {
    if (searchQuery.trim()) {
      const trimmedValue = searchQuery.trim()
      const customId = `custom-${trimmedValue}`
      onChange(customId)
      setCustomValueName(trimmedValue)
      if (onCustomOption) {
        onCustomOption(trimmedValue)
      }
      setIsOpen(false)
      setSearchQuery('')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setIsOpen(true)
  }

  const handleFocus = () => {
    setIsOpen(true)
  }

  // When dropdown is open and typing, show search query
  // When dropdown is closed or not typing, show the selected value's name
  const displayValue = isOpen && searchQuery ? searchQuery : (customValueName || selectedOption?.name || '')

  const themeColors = {
    purple: {
      border: error ? 'border-red-500 focus:ring-red-500' : 'border-gray-700 focus:ring-purple-500',
      selectedBg: 'bg-purple-500/20',
      checkmark: 'text-purple-400',
    },
    blue: {
      border: error ? 'border-red-500 focus:ring-red-500' : 'border-gray-700 focus:ring-blue-500',
      selectedBg: 'bg-blue-500/20',
      checkmark: 'text-blue-400',
    },
  }

  const colors = themeColors[colorTheme]

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          className={`w-full px-4 py-3 pr-10 bg-gray-900 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 ${colors.border}`}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {filteredOptions.length === 0 ? (
            hasNoResults && allowCustom ? (
              <button
                type="button"
                onClick={handleCreateCustomOption}
                className="w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors flex items-center gap-3"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-white">Usar "{searchQuery.trim()}"</span>
              </button>
            ) : (
              <div className="px-4 py-3 text-gray-400 text-sm">
                {emptyMessage}
              </div>
            )
          ) : (
            filteredOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelectOption(option.id, option.name)}
                className={`w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors flex items-center gap-3 ${value === option.id ? colors.selectedBg : ''}`}
              >
                {option.icon && <span className="text-xl">{option.icon}</span>}
                <span className="text-white">{option.name}</span>
                {value === option.id && (
                  <svg className={`w-5 h-5 ${colors.checkmark} ml-auto`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))
          )}
        </div>
      )}

      {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
    </div>
  )
}

export default AutocompleteSelect
