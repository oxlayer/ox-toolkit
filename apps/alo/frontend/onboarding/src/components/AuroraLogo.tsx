const AuroraLogo = ({ step }: { step: number }) => {
  return (
    <div className="text-center mb-8">
      <img src="logo.svg" alt="Aurora Logo" className={`${step === 1 ? 'w-24 h-24' : 'w-24 h-24'} mx-auto`} />
      {step === 1 && <p className="text-gray-400">Conectando você à sua cidade</p>}
    </div>
  )
}

export default AuroraLogo
