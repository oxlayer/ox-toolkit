import { useEffect } from 'react'

type SuccessPageProps = {
  type: 'provider' | 'company'
}

const SuccessPage = ({ type }: SuccessPageProps) => {
  useEffect(() => {
    // Redirect to the admin panel after showing the message
    const timer = setTimeout(() => {
      window.location.href = 'http://localhost:6177'
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  const isProvider = type === 'provider'

  return (
    <div className="text-center py-8">
      <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h2 className="text-2xl font-semibold text-white mb-2">
        Parabéns! Conta criada com sucesso!
      </h2>

      <p className="text-gray-400 mb-6">
        {isProvider
          ? 'Agora falta pouco para terminar de configurar seus serviços.'
          : 'Agora falta pouco para terminar de configurar seus produtos.'}
      </p>

      <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800 mb-6">
        <p className="text-gray-300 text-sm mb-2">
          Você será redirecionado automaticamente para o gerenciador...
        </p>
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>

      <button
        onClick={() => {
          window.location.href = 'http://localhost:6177'
        }}
        className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors"
      >
        Ir para o seu gestor de catálogo agora
      </button>
    </div>
  )
}

export default SuccessPage
