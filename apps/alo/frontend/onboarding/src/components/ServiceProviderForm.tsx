import { useState, useEffect } from 'react'
import { apiService, type ServiceCategory } from '../services/api'
import AutocompleteSelect from './AutocompleteSelect'

const categoryIcons: Record<string, string> = {
  'Beleza e Estética': '💇',
  'Saúde e Bem-estar': '🏥',
  'Educação': '📚',
  'Tecnologia': '💻',
  'Construção e Reformas': '🔧',
  'Limpeza e Faxina': '🧹',
  'Alimentação': '🍽️',
  'Transporte': '🚗',
  'Eventos': '🎉',
  'Outro': '📦',
}

interface ServiceProviderFormProps {
  onSubmit: (data: any) => void
  onBack: () => void
}

interface FormErrors {
  category?: string
  name?: string
  cpf?: string
  phone?: string
  email?: string
  terms?: string
  privacy?: string
  submit?: string
}

const ServiceProviderForm = ({ onSubmit, onBack }: ServiceProviderFormProps) => {
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [customCategory, setCustomCategory] = useState('')
  const [formData, setFormData] = useState<{
    categoryId: string | number
    name: string
    cpf: string
    phone: string
    email: string
    termsAccepted: boolean
    privacyAccepted: boolean
  }>({
    categoryId: '',
    name: '',
    cpf: '',
    phone: '',
    email: '',
    termsAccepted: false,
    privacyAccepted: false,
  })
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await apiService.getServiceCategories()
        setCategories(data)
      } catch (error) {
        console.error('Failed to fetch categories:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  const validateCPF = (cpf: string) => {
    cpf = cpf.replace(/\D/g, '')

    if (cpf.length !== 11) return false
    if (/^(\d)\1+$/.test(cpf)) return false

    const calc = (factor: number) => {
      let total = 0
      for (let i = 0; i < factor - 1; i++) {
        total += Number(cpf[i]) * (factor - i)
      }
      const rest = (total * 10) % 11
      return rest === 10 ? 0 : rest
    }

    return calc(10) === Number(cpf[9]) && calc(11) === Number(cpf[10])
  }

  const validatePhone = (phone: string) => {
    phone = phone.replace(/\D/g, '')
    if (phone.length < 10 || phone.length > 11) return false
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    if (!formData.categoryId) newErrors.category = 'Selecione uma categoria'
    if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório'
    if (!formData.cpf.trim()) {
      newErrors.cpf = 'CPF é obrigatório'
    } else if (!validateCPF(formData.cpf)) {
      newErrors.cpf = 'CPF inválido'
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
        user_type: 'provider',
        category: typeof formData.categoryId === 'string' && formData.categoryId.startsWith('custom-')
          ? customCategory
          : String(formData.categoryId),
        document: formData.cpf,
        email: formData.email || undefined,
        name: formData.name,
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

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 11)
    let formatted = ''

    for (let i = 0; i < value.length; i++) {
      if (i === 3) {
        formatted += '.'
      } else if (i === 6) {
        formatted += '.'
      } else if (i === 9) {
        formatted += '-'
      }
      formatted += value[i]
    }

    setFormData({ ...formData, cpf: formatted })
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-2xl font-semibold text-white">Cadastro de Prestador</h2>

      <AutocompleteSelect
        options={categories.map(cat => ({ id: String(cat.id), name: cat.name, icon: categoryIcons[cat.name] }))}
        value={String(formData.categoryId)}
        onChange={(categoryId) => {
          setFormData({ ...formData, categoryId })
          setErrors({ ...errors, category: undefined })
        }}
        onCustomOption={(customValue) => setCustomCategory(customValue)}
        error={errors.category}
        colorTheme="purple"
        allowCustom
      />

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Nome Completo</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className={`w-full px-4 py-3 bg-gray-900 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 ${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-700 focus:ring-purple-500'
            }`}
          placeholder="Seu nome completo"
        />
        {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">CPF</label>
        <input
          type="text"
          value={formData.cpf}
          onChange={handleCPFChange}
          className={`w-full px-4 py-3 bg-gray-900 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 ${errors.cpf ? 'border-red-500 focus:ring-red-500' : 'border-gray-700 focus:ring-purple-500'
            }`}
          placeholder="000.000.000-00"
          maxLength={14}
        />
        {errors.cpf && <p className="text-red-400 text-sm mt-1">{errors.cpf}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Telefone</label>
        <input
          type="tel"
          value={formData.phone}
          onChange={handlePhoneChange}
          className={`w-full px-4 py-3 bg-gray-900 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 ${errors.phone ? 'border-red-500 focus:ring-red-500' : 'border-gray-700 focus:ring-purple-500'
            }`}
          placeholder="(00) 00000-0000"
          maxLength={15}
        />
        {errors.phone && <p className="text-red-400 text-sm mt-1">{errors.phone}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Email (opcional)</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className={`w-full px-4 py-3 bg-gray-900 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 ${errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-700 focus:ring-purple-500'
            }`}
          placeholder="seu@email.com"
        />
        {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
      </div>

      <div className="space-y-3">
        <label className="flex items-start space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.termsAccepted}
            onChange={(e) => setFormData({ ...formData, termsAccepted: e.target.checked })}
            className="mt-1 w-4 h-4 rounded border-gray-600 bg-gray-900 text-[#fb6a24] focus:ring-[#fc9523] focus:ring-offset-gray-900"
          />
          <span className="text-sm text-gray-300">
            Declaro que sou responsável legal e aceito os{' '}
            <a href="#" className="text-[#fb6a24] hover:text-[#fc9523]">termos de uso</a>
          </span>
        </label>
        {errors.terms && <p className="text-red-400 text-sm">{errors.terms}</p>}

        <label className="flex items-start space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.privacyAccepted}
            onChange={(e) => setFormData({ ...formData, privacyAccepted: e.target.checked })}
            className="mt-1 w-4 h-4 rounded border-gray-600 bg-gray-900 text-[#fb6a24] focus:ring-[#fc9523] focus:ring-offset-gray-900"
          />
          <span className="text-sm text-gray-300">
            Li e aceito a{' '}
            <a href="#" className="text-[#fb6a24] hover:text-[#fc9523]">política de privacidade</a>
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
          className="flex-1 px-6 py-3 bg-[#fb6a24] text-white rounded-lg hover:bg-[#fb6a24]/80 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Enviando...' : 'Enviar'}
        </button>
      </div>
    </form>
  )
}

export default ServiceProviderForm
