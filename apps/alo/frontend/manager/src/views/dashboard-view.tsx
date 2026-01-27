import { Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '@acme/ui'
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
      title: 'Establishments',
      value: establishments?.length ?? 0,
      gradient: 'blue',
      link: '/establishments',
      icon: <Building2 className="size-6" />,
    },
    {
      title: 'Users',
      value: users?.length ?? 0,
      gradient: 'green',
      link: '/users',
      icon: <Users className="size-6" />,
    },
    {
      title: 'Delivery Men',
      value: deliveryMen?.length ?? 0,
      gradient: 'purple',
      link: '/delivery-men',
      icon: <UserMinus className="size-6" />,
    },
    {
      title: 'New Leads',
      value: newLeadsCount,
      gradient: 'primary',
      link: '/providers',
      icon: <Wrench className="size-6" />,
    },
  ]

  const quickActions = [
    { to: '/establishments/new', label: 'Add Establishment', variant: 'default' as const },
    { to: '/users/new', label: 'Add User', variant: 'default' as const },
    { to: '/delivery-men/new', label: 'Add Delivery Man', variant: 'default' as const },
  ]

  return (
    <div className="space-y-8">
      <PageHeader title="Dashboard" description="Welcome to Aurora Manager Portal" />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="border-border bg-surface">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.to}
                to={action.to}
                className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-primary-500 to-primary-400 px-6 py-3 font-medium text-white transition-all hover:shadow-lg"
              >
                <span>{action.label}</span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-border bg-surface">
          <CardHeader>
            <CardTitle>Recent Establishments</CardTitle>
          </CardHeader>
          <CardContent>
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
              <p className="py-4 text-center text-gray-500 dark:text-gray-400">No establishments yet</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-surface">
          <CardHeader>
            <CardTitle>Pending Leads</CardTitle>
          </CardHeader>
          <CardContent>
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
                        className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          lead.user_type === 'provider'
                            ? 'bg-linear-to-br from-primary-500/20 to-primary-400/20'
                            : 'bg-linear-to-br from-blue-500/20 to-indigo-600/20'
                        }`}
                      >
                        <div
                          className={`size-4 rounded-full ${
                            lead.user_type === 'provider' ? 'bg-primary-500' : 'bg-blue-500'
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
              <p className="py-4 text-center text-gray-500 dark:text-gray-400">No pending leads</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
