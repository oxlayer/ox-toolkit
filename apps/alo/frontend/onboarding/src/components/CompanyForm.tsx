import { useState, useEffect } from 'react'
import { apiService, type EstablishmentType } from '../services/api'
import AutocompleteSelect from './AutocompleteSelect'

const establishmentTypeIcons: Record<string, string> = {
  'Comércio': '🏪',
  'Restaurante e Lanchonete': '🍕',
  'Serviços': '🔧',
  'Saúde': '🏥',
  'Educação': '🎓',
  'Entretenimento': '🎬',
  'Hotelaria': '🏨',
  'Serviços Profissionais': '💼',
  'Indústria': '🏭',
  'Outro': '📦',
}

interface CompanyFormProps {
  onSubmit: (data: any) => void
  onBack: () => void
}

interface FormErrors {
  category?: string
  cnpj?: string
  phone?: string
  email?: string
  terms?: string
  privacy?: string
  submit?: string
}

const CompanyForm = ({ onSubmit, onBack }: CompanyFormProps) => {
  const [establishmentTypes, setEstablishmentTypes] = useState<EstablishmentType[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [customEstablishmentType, setCustomEstablishmentType] = useState('')
  const [formData, setFormData] = useState({
    establishmentTypeId: '',
    cnpj: '',
    phone: '',
    email: '',
    termsAccepted: false,
    privacyAccepted: false,
  })
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    const fetchEstablishmentTypes = async () => {
      try {
        const data = await apiService.getEstablishmentTypes()
        setEstablishmentTypes(data)
      } catch (error) {
        console.error('Failed to fetch establishment types:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchEstablishmentTypes()
  }, [])

  const validateCNPJ = (cnpj: string) => {
    cnpj = cnpj.replace(/\D/g, '')

    if (cnpj.length !== 14) return false
    if (/^(\d)\1+$/.test(cnpj)) return false

    const calc = (length: number) => {
      const numbers = cnpj.substring(0, length)
      const weights = length === 12
        ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

      let sum = 0
      for (let i = 0; i < weights.length; i++) {
        sum += Number(numbers[i]) * weights[i]
      }

      const rest = sum % 11
      return rest < 2 ? 0 : 11 - rest
    }

    return calc(12) === Number(cnpj[12]) && calc(13) === Number(cnpj[13])
  }

  const validatePhone = (phone: string) => {
    phone = phone.replace(/\D/g, '')
    if (phone.length < 10 || phone.length > 11) return false
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    if (!formData.establishmentTypeId) newErrors.category = 'Selecione uma categoria'
    if (!formData.cnpj.trim()) {
      newErrors.cnpj = 'CNPJ é obrigatório'
    } else if (!validateCNPJ(formData.cnpj)) {
      newErrors.cnpj = 'CNPJ inválido'
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório'
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Telefone inválido'
    }
    if (formData.email.trim() && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido'
    }
    if (!formData.termsAccepted) newErrors.terms = 'Aceite os termos'
    if (!formData.privacyAccepted) newErrors.privacy = 'Aceite a política de privacidade'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setSubmitting(true)
    try {
      await apiService.submitOnboardingLead({
        user_type: 'company',
        establishment_type: formData.establishmentTypeId.startsWith('custom-') ? customEstablishmentType : formData.establishmentTypeId,
        document: formData.cnpj,
        email: formData.email || undefined,
        phone: formData.phone,
        terms_accepted: formData.termsAccepted,
        privacy_accepted: formData.privacyAccepted,
      })
      onSubmit(formData)
    } catch (error) {
      console.error('Failed to submit lead:', error)
      setErrors({ submit: 'Erro ao enviar cadastro. Tente novamente.' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 14)
    let formatted = ''

    for (let i = 0; i < value.length; i++) {
      if (i === 2) {
        formatted += '.'
      } else if (i === 5) {
        formatted += '.'
      } else if (i === 8) {
        formatted += '/'
      } else if (i === 12) {
        formatted += '-'
      }
      formatted += value[i]
    }

    setFormData({ ...formData, cnpj: formatted })
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 11)
    let formatted = ''

    for (let i = 0; i < value.length; i++) {
      if (i === 0) {
        formatted += '('
      } else if (i === 2) {
        formatted += ') '
      } else if (i === 7) {
        formatted += '-'
      }
      formatted += value[i]
    }

    setFormData({ ...formData, phone: formatted })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-2xl font-semibold text-white">Cadastro de Empresa</h2>

      <AutocompleteSelect
        options={establishmentTypes.map(type => ({ id: type.id, name: type.name, icon: establishmentTypeIcons[type.name] }))}
        value={formData.establishmentTypeId}
        onChange={(establishmentTypeId) => {
          setFormData({ ...formData, establishmentTypeId })
          setErrors({ ...errors, category: undefined })
        }}
        onCustomOption={(customValue) => setCustomEstablishmentType(customValue)}
        error={errors.category}
        colorTheme="blue"
        allowCustom
      />

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">CNPJ</label>
        <input
          type="text"
          value={formData.cnpj}
          onChange={handleCNPJChange}
          className={`w-full px-4 py-3 bg-gray-900 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 ${errors.cnpj ? 'border-red-500 focus:ring-red-500' : 'border-gray-700 focus:ring-blue-500'
            }`}
          placeholder="00.000.000/0000-00"
          maxLength={18}
        />
        {errors.cnpj && <p className="text-red-400 text-sm mt-1">{errors.cnpj}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Telefone do Responsável</label>
        <input
          type="tel"
          value={formData.phone}
          onChange={handlePhoneChange}
          className={`w-full px-4 py-3 bg-gray-900 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 ${errors.phone ? 'border-red-500 focus:ring-red-500' : 'border-gray-700 focus:ring-blue-500'
            }`}
          placeholder="(00) 00000-0000"
          maxLength={15}
        />
        {errors.phone && <p className="text-red-400 text-sm mt-1">{errors.phone}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Email do Responsável (opcional)
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className={`w-full px-4 py-3 bg-gray-900 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 ${errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-700 focus:ring-blue-500'
            }`}
          placeholder="responsavel@empresa.com"
        />
        {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
      </div>

      <div className="space-y-3">
        <label className="flex items-start space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.termsAccepted}
            onChange={(e) => setFormData({ ...formData, termsAccepted: e.target.checked })}
            className="mt-1 w-4 h-4 rounded border-gray-600 bg-gray-900 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900"
          />
          <span className="text-sm text-gray-300">
            Declaro que sou responsável legal e aceito os{' '}
            <a href="#" className="text-blue-400 hover:text-blue-300">termos de uso</a>
          </span>
        </label>
        {errors.terms && <p className="text-red-400 text-sm">{errors.terms}</p>}

        <label className="flex items-start space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.privacyAccepted}
            onChange={(e) => setFormData({ ...formData, privacyAccepted: e.target.checked })}
            className="mt-1 w-4 h-4 rounded border-gray-600 bg-gray-900 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900"
          />
          <span className="text-sm text-gray-300">
            Li e aceito a{' '}
            <a href="#" className="text-blue-400 hover:text-blue-300">política de privacidade</a>
          </span>
        </label>
        {errors.privacy && <p className="text-red-400 text-sm">{errors.privacy}</p>}
      </div>

      {errors.submit && <p className="text-red-400 text-sm">{errors.submit}</p>}

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
          disabled={submitting}
        >
          Voltar
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Enviando...' : 'Enviar'}
        </button>
      </div>
    </form>
  )
}

export default CompanyForm
