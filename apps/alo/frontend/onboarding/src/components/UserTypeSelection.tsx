const UserTypeSelection = ({ onSelect }: { onSelect: (type: string) => void }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-white text-center">
        Você é um...
      </h2>
      <div className="space-y-4 mt-8">
        <button
          onClick={() => onSelect('provider')}
          className="w-full p-6 border border-gray-700 rounded-xl text-left hover:border-[#fb6a24] transition-all duration-300 group"
        >
          <div className="flex items-center space-x-4 justify-center sm:justify-start cursor-pointer">
            <div className="hidden sm:flex w-12 h-12 bg-[#2c2229]/70 rounded-full items-center justify-center group-hover:bg-[#2c2229] transition-all">
              <svg className="w-6 h-6 text-[#fb6a24]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">Prestador de Serviço</h3>
              <p className="text-gray-400 text-sm">Ofereça seus serviços para a cidade</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => onSelect('company')}
          className="w-full p-6 border border-gray-700 rounded-xl text-left hover:border-blue-500 transition-all duration-300 group"
        >
          <div className="flex items-center space-x-4 justify-center sm:justify-start cursor-pointer">
            <div className="hidden sm:flex w-12 h-12 bg-blue-500/20 rounded-full items-center justify-center group-hover:bg-blue-500/30 transition-all">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">Empresa</h3>
              <p className="text-gray-400 text-sm">Aumente a visibilidade do seu negócio</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  )
}

export default UserTypeSelection
