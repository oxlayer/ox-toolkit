import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/shared'
import { ButtonTech as TechButton, CardTech, InputTech, Select, SelectTrigger, SelectValue, SelectPopup, SelectItem, FieldTech, LabelTech } from '@acme/ui'

interface AddressData {
  address: string
  neighborhood: string
  city: string
  state: string
  complement?: string
}

interface OnboardingFormData {
  name: string
  logo: string
  legalName: string
  businessType: 'me' | 'mei' | ''
  zipCode: string
  address: string
  addressNumber: string
  addressComplement: string
  neighborhood: string
  city: string
  state: string
}

const defaultFormData: OnboardingFormData = {
  name: '',
  logo: '',
  legalName: '',
  businessType: '',
  zipCode: '',
  address: '',
  addressNumber: '',
  addressComplement: '',
  neighborhood: '',
  city: '',
  state: '',
}

/**
 * Onboarding Complete View
 *
 * Allows newly registered users to complete their profile configuration
 */
export function OnboardingCompleteView() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [formData, setFormData] = useState<OnboardingFormData>(defaultFormData)
  const [isLoading, setIsLoading] = useState(false)
  const [isLookingUpCep, setIsLookingUpCep] = useState(false)
  const [cepError, setCepError] = useState('')
  const [status, setStatus] = useState<'loading' | 'complete' | 'incomplete'>('loading')
  const [userDocumentType, setUserDocumentType] = useState<'cpf' | 'cnpj'>('cpf')

  // Get credentials from URL for auto-login (in production, use a token)
  const username = searchParams.get('u')
  const password = searchParams.get('p')

  useEffect(() => {
    // Check if user is authenticated and get onboarding status
    const checkOnboardingStatus = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token && username && password) {
          // Auto-login with credentials from convert-lead flow
          // In production, use a one-time token instead
          const loginResponse = await fetch('/api/auth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username,
              password,
              grant_type: 'password',
            }),
          })
          if (loginResponse.ok) {
            const data = await loginResponse.json()
            localStorage.setItem('token', data.access_token)
          }
        }

        // Get onboarding status
        const response = await fetch('/api/onboarding/me', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setStatus(data.isComplete ? 'complete' : 'incomplete')
          setUserDocumentType(data.user.documentType || 'cpf')

          // Pre-fill form data
          if (data.user) {
            setFormData((prev) => ({ ...prev, name: data.user.name || '' }))
          }
          if (data.establishment) {
            setFormData((prev) => ({
              ...prev,
              logo: data.establishment.logo || '',
              legalName: data.establishment.legalName || '',
              businessType: data.establishment.businessType || '',
              zipCode: data.establishment.address?.zipCode || '',
              address: data.establishment.address?.address || '',
              addressNumber: data.establishment.address?.addressNumber || '',
              addressComplement: data.establishment.address?.addressComplement || '',
              neighborhood: data.establishment.address?.neighborhood || '',
              city: data.establishment.address?.city || '',
              state: data.establishment.address?.state || '',
            }))
          }
        } else {
          // Not authenticated, redirect to login
          navigate('/login')
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error)
        navigate('/login')
      }
    }

    checkOnboardingStatus()
  }, [navigate, username, password])

  const handleCepLookup = async () => {
    const cep = formData.zipCode.replace(/\D/g, '')
    if (cep.length !== 8) {
      setCepError('CEP deve ter 8 dígitos')
      return
    }

    setIsLookingUpCep(true)
    setCepError('')

    try {
      const response = await fetch('/api/onboarding/address/cep', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ cep }),
      })

      const data: AddressData = await response.json()

      if (response.ok) {
        setFormData((prev) => ({
          ...prev,
          address: data.address || '',
          neighborhood: data.neighborhood || '',
          city: data.city || '',
          state: data.state || '',
        }))
      } else {
        setCepError('CEP não encontrado')
      }
    } catch (error) {
      console.error('Error looking up CEP:', error)
      setCepError('Erro ao buscar CEP')
    } finally {
      setIsLookingUpCep(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setStatus('complete')
        // Redirect to dashboard after a short delay
        setTimeout(() => navigate('/'), 2000)
      } else {
        const error = await response.json()
        alert(error.message || 'Erro ao completar cadastro')
      }
    } catch (error) {
      console.error('Error completing onboarding:', error)
      alert('Erro ao completar cadastro')
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="inline-block size-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
      </div>
    )
  }

  if (status === 'complete') {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Cadastro Completo!"
          description="Seu cadastro foi completado com sucesso. Redirecionando..."
        />
        <CardTech className="p-6 text-center">
          <div className="text-4xl mb-4">✅</div>
          <p className="text-muted-foreground">Você será redirecionado para o painel principal...</p>
        </CardTech>
      </div>
    )
  }

  const isCompany = userDocumentType === 'cnpj'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Complete seu Cadastro"
        description="Preencha as informações abaixo para finalizar seu cadastro"
      />

      <CardTech className="p-6">
        <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
          {/* Name */}
          <FieldTech>
            <LabelTech htmlFor="name" required>Nome Completo</LabelTech>
            <InputTech
              id="name"
              name="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              required
              placeholder="Seu nome ou nome do estabelecimento"
            />
          </FieldTech>

          {/* Logo */}
          <FieldTech>
            <LabelTech htmlFor="logo">URL do Logo</LabelTech>
            <InputTech
              id="logo"
              name="logo"
              type="url"
              value={formData.logo}
              onChange={(e) => setFormData((prev) => ({ ...prev, logo: e.target.value }))}
              placeholder="https://exemplo.com/logo.png"
            />
            <p className="text-xs text-stone-500 mt-1">
              Cole a URL da imagem do seu logo
            </p>
          </FieldTech>

          {/* Business Fields (for CNPJ) */}
          {isCompany && (
            <>
              <FieldTech>
                <LabelTech htmlFor="legalName">Razão Social</LabelTech>
                <InputTech
                  id="legalName"
                  name="legalName"
                  value={formData.legalName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, legalName: e.target.value }))}
                  placeholder="Nome oficial da empresa"
                />
              </FieldTech>

              <FieldTech>
                <LabelTech htmlFor="businessType">Tipo de Negócio</LabelTech>
                <Select
                  value={formData.businessType}
                  onChange={(value) => setFormData((prev) => ({ ...prev, businessType: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectPopup>
                    <SelectItem value="me">ME - Microempresa</SelectItem>
                    <SelectItem value="mei">MEI - Microempreendedor Individual</SelectItem>
                  </SelectPopup>
                </Select>
              </FieldTech>
            </>
          )}

          {/* Address Section */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="text-lg font-semibold">Endereço</h3>

            {/* CEP with lookup */}
            <div className="flex gap-2">
              <FieldTech className="flex-1">
                <LabelTech htmlFor="zipCode">CEP</LabelTech>
                <InputTech
                  id="zipCode"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '')
                    // Format as 00000-000
                    const formatted = value.replace(/(\d{5})(\d{3})/, '$1-$2')
                    setFormData((prev) => ({ ...prev, zipCode: formatted }))
                  }}
                  placeholder="00000-000"
                  maxLength={9}
                />
              </FieldTech>
              <TechButton
                type="button"
                variant="outline"
                onClick={handleCepLookup}
                disabled={isLookingUpCep || !formData.zipCode}
                className="mt-6"
              >
                {isLookingUpCep ? 'Buscando...' : 'Buscar CEP'}
              </TechButton>
            </div>
            {cepError && <p className="text-sm text-destructive">{cepError}</p>}

            {/* Address */}
            <FieldTech>
              <LabelTech htmlFor="address">Endereço</LabelTech>
              <InputTech
                id="address"
                name="address"
                value={formData.address}
                onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                placeholder="Rua, Avenida, etc."
              />
            </FieldTech>

            {/* Address Number */}
            <FieldTech>
              <LabelTech htmlFor="addressNumber" required>Número</LabelTech>
              <InputTech
                id="addressNumber"
                name="addressNumber"
                value={formData.addressNumber}
                onChange={(e) => setFormData((prev) => ({ ...prev, addressNumber: e.target.value }))}
                placeholder="123"
                required
              />
            </FieldTech>

            {/* Address Complement */}
            <FieldTech>
              <LabelTech htmlFor="addressComplement">Complemento</LabelTech>
              <InputTech
                id="addressComplement"
                name="addressComplement"
                value={formData.addressComplement}
                onChange={(e) => setFormData((prev) => ({ ...prev, addressComplement: e.target.value }))}
                placeholder="Apto, Sala, etc."
              />
            </FieldTech>

            {/* Neighborhood */}
            <FieldTech>
              <LabelTech htmlFor="neighborhood">Bairro</LabelTech>
              <InputTech
                id="neighborhood"
                name="neighborhood"
                value={formData.neighborhood}
                onChange={(e) => setFormData((prev) => ({ ...prev, neighborhood: e.target.value }))}
                placeholder="Bairro"
              />
            </FieldTech>

            {/* City and State */}
            <div className="grid grid-cols-3 gap-4">
              <FieldTech className="col-span-2">
                <LabelTech htmlFor="city">Cidade</LabelTech>
                <InputTech
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                  placeholder="Cidade"
                />
              </FieldTech>
              <FieldTech>
                <LabelTech htmlFor="state">UF</LabelTech>
                <InputTech
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={(e) => setFormData((prev) => ({ ...prev, state: e.target.value.toUpperCase() }))}
                  placeholder="SP"
                  maxLength={2}
                />
              </FieldTech>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4 pt-4">
            <TechButton
              type="button"
              variant="outline"
              onClick={() => navigate('/')}
            >
              Cancelar
            </TechButton>
            <TechButton type="submit" variant="solid" disabled={isLoading}>
              {isLoading ? 'Salvando...' : 'Completar Cadastro'}
            </TechButton>
          </div>
        </form>
      </CardTech>
    </div>
  )
}
