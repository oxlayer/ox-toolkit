import { useState } from 'react'
import UserTypeSelection from './UserTypeSelection'
import ServiceProviderForm from './ServiceProviderForm'
import CompanyForm from './CompanyForm'
import SuccessPage from './SuccessPage'
import Logo from './Logo'

const OnboardingFlow = () => {
  const [step, setStep] = useState(1)
  const [userType, setUserType] = useState<string | null>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})

  const handleUserTypeSelect = (type: string) => {
    setUserType(type)
    setStep(2)
  }

  const handleFormSubmit = (data: Record<string, any>) => {
    setFormData({ ...formData, ...data })
    setStep(4)
  }

  const handleBack = () => {
    if (step === 2) {
      setStep(1)
      setUserType(null)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Logo step={step} />
        <div className="bg-black/50 backdrop-blur-lg border border-gray-800 rounded-2xl p-8 shadow-2xl">
          {step === 1 && <UserTypeSelection onSelect={handleUserTypeSelect} />}
          {step === 2 && userType === 'provider' && (
            <ServiceProviderForm onSubmit={handleFormSubmit} onBack={handleBack} />
          )}
          {step === 2 && userType === 'company' && (
            <CompanyForm onSubmit={handleFormSubmit} onBack={handleBack} />
          )}
          {step === 4 && <SuccessPage type={userType as 'provider' | 'company'} />}
        </div>
        <p className="text-center text-gray-500 text-sm mt-4">
          Se cadastre no catálogo digital de Montes Claros.
        </p>
      </div>
    </div>
  )
}

export default OnboardingFlow
