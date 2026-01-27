const SuccessPage = () => {
  return (
    <div className="text-center py-8">
      <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h2 className="text-2xl font-semibold text-white mb-4">
        Cadastro Recebido!
      </h2>

      <p className="text-gray-400 mb-8">
        Entraremos em contato em breve para finalizar o seu cadastro na Aurora.
      </p>

      <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
        <p className="text-gray-300 text-sm">
          Com a Aurora você se conecta com a sua cidade com uma mensagem ou áudio.
          Sem sair do WhatsApp.
        </p>
      </div>
    </div>
  )
}

export default SuccessPage
