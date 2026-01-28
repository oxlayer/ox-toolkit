import { Link } from 'react-router-dom'
import { CardTech, CardTechHeader, CardTechTitle, CardTechContent, TechButton } from '@acme/ui'
import { PageHeader, StatCard } from '@/components/shared'
import { useEstablishments, useUsers, useDeliveryMen, useOnboardingLeads } from '@/hooks'
import { Building2, Users, UserMinus, Wrench } from 'lucide-react'

/**
 * Dashboard view - Main overview of the manager portal
 */
export function DashboardView() {
  const { data: establishments } = useEstablishments()
  const { data: users } = useUsers()
  const { data: deliveryMen } = useDeliveryMen()
  const { data: leads } = useOnboardingLeads()

  const newLeadsCount = leads?.filter((l) => l.status === 'new').length ?? 0

  const stats = [
    {
      title: 'Empresas',
      value: establishments?.length ?? 0,
      gradient: 'blue' as const,
      link: '/establishments',
      icon: <Building2 className="size-6" />,
    },
    {
      title: 'Prestadores de Serviço',
      value: users?.length ?? 0,
      gradient: 'green' as const,
      link: '/users',
      icon: <Users className="size-6" />,
    },
    {
      title: 'Entregadores',
      value: deliveryMen?.length ?? 0,
      gradient: 'purple' as const,
      link: '/delivery-men',
      icon: <UserMinus className="size-6" />,
    },
    {
      title: 'Novos Leads',
      value: newLeadsCount,
      gradient: 'orange' as const,
      link: '/providers',
      icon: <Wrench className="size-6" />,
    },
  ]

  const quickActions = [
    { to: '/establishments/new', label: 'Adicionar Empresa' },
    { to: '/users/new', label: 'Adicionar Usuário' },
    { to: '/delivery-men/new', label: 'Adicionar Entregador' },
  ]

  return (
    <div className="space-y-8">
      <PageHeader title="Dashboard" description="Bem-vindo, Robert" />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Quick Actions */}
      <CardTech className="border-border bg-surface">
        <CardTechHeader>
          <CardTechTitle>Ações rápidas</CardTechTitle>
        </CardTechHeader>
        <CardTechContent>
          <div className="flex flex-wrap gap-4">
            {quickActions.map((action) => (
              <Link key={action.to} to={action.to}>
                <TechButton variant="solid" size="lg">
                  <span>{action.label}</span>
                </TechButton>
              </Link>
            ))}
          </div>
        </CardTechContent>
      </CardTech>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CardTech className="border-border bg-surface">
          <CardTechHeader>
            <CardTechTitle>Empresas recentes</CardTechTitle>
          </CardTechHeader>
          <CardTechContent>
            {establishments && establishments.length > 0 ? (
              <div className="space-y-3">
                {establishments.slice(0, 5).map((est) => (
                  <Link
                    key={est.id}
                    to={`/establishments/${est.id}`}
                    className="flex items-center gap-4 rounded-lg p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <div className="size-4 rounded-full bg-blue-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-gray-900 dark:text-white">{est.name}</p>
                      <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                        {est.whatsapp || est.website || 'No contact info'}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-gray-500 dark:text-gray-400">Nenhuma empresa cadastrada</p>
            )}
          </CardTechContent>
        </CardTech>

        <CardTech className="border-border bg-surface">
          <CardTechHeader>
            <CardTechTitle>Leads pendentes</CardTechTitle>
          </CardTechHeader>
          <CardTechContent>
            {leads && leads.length > 0 ? (
              <div className="space-y-3">
                {leads
                  .filter((l) => l.status === 'new')
                  .slice(0, 5)
                  .map((lead) => (
                    <Link
                      key={lead.id}
                      to="/providers"
                      className="flex items-center gap-4 rounded-lg p-3 transition-colors hover:bg-muted/50"
                    >
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-lg ${lead.user_type === 'provider'
                          ? 'bg-linear-to-br from-primary-500/20 to-primary-400/20'
                          : 'bg-linear-to-br from-blue-500/20 to-indigo-600/20'
                          }`}
                      >
                        <div
                          className={`size-4 rounded-full ${lead.user_type === 'provider' ? 'bg-primary-500' : 'bg-blue-500'
                            }`}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-gray-900 dark:text-white">
                          {lead.name || lead.email}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{lead.phone}</p>
                      </div>
                    </Link>
                  ))}
              </div>
            ) : (
              <p className="py-4 text-center text-gray-500 dark:text-gray-400">Nenhum lead pendente</p>
            )}
          </CardTechContent>
        </CardTech>
      </div>
    </div>
  )
}
