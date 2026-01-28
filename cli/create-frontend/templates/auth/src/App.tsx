/**
 * Main App Component
 */

import { useAuth } from './lib/auth-provider'
import { useEstablishments } from './hooks'
import { establishmentsApi } from './services/api'

export default function App() {
  const { isAuthenticated, isLoading, user } = useAuth()

  // Example: Create establishment mutation (would use useMutation in real app)
  const handleCreateEstablishment = async (data: CreateEstablishmentInput) => {
    try {
      await establishmentsApi.createEstablishment(data)
      alert('Establishment created!')
    } catch (error) {
      alert('Failed to create establishment')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Welcome to {{PROJECT_NAME}}</h1>
          <p className="text-muted-foreground mb-6">Please log in to continue</p>
          <button
            onClick={() => useAuth.getState().login()}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition font-medium"
          >
            Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-surface">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">{{PROJECT_NAME}}</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                {user?.preferred_username || user?.email || 'User'}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <EstablishmentsList onCreate={handleCreateEstablishment} />
      </main>
    </div>
  )
}

/**
 * Establishments List Component
 */
function EstablishmentsList({ onCreate }: { onCreate: (data: CreateEstablishmentInput) => void }) {
  const { data, isLoading, error } = useEstablishments()

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Error loading establishments</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Establishments</h2>
      </div>

      {data?.data?.length === 0 ? (
        <p className="text-muted-foreground">No establishments found</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.data.map((establishment) => (
            <div
              key={establishment.id}
              className="bg-surface rounded-lg border border-border p-6"
            >
              <h3 className="font-semibold mb-2">{establishment.name}</h3>
              {establishment.address && (
                <p className="text-sm text-muted-foreground mb-2">{establishment.address}</p>
              )}
              {establishment.phone && (
                <p className="text-sm text-muted-foreground">{establishment.phone}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Created {new Date(establishment.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
