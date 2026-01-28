import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@acme/ui';
import { establishmentsService } from '../services/establishments';
import { usersService, deliveryMenService } from '../services/users';
import { onboardingLeadsService } from '../services/onboardingLeads';

export default function Dashboard() {
  const { data: establishments } = useQuery({
    queryKey: ['establishments'],
    queryFn: establishmentsService.getAll,
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: usersService.getAll,
  });

  const { data: deliveryMen } = useQuery({
    queryKey: ['delivery-men'],
    queryFn: deliveryMenService.getAll,
  });

  const { data: leads } = useQuery({
    queryKey: ['onboarding-leads'],
    queryFn: onboardingLeadsService.getAll,
  });

  const newLeadsCount = leads?.filter(l => l.status === 'new').length || 0;

  const stats = [
    {
      title: 'Establishments',
      value: establishments?.length || 0,
      gradient: 'from-blue-500 to-blue-600',
      link: '/establishments',
    },
    {
      title: 'Users',
      value: users?.length || 0,
      gradient: 'from-green-500 to-green-600',
      link: '/users',
    },
    {
      title: 'Delivery Men',
      value: deliveryMen?.length || 0,
      gradient: 'from-purple-500 to-purple-600',
      link: '/delivery-men',
    },
    {
      title: 'New Leads',
      value: newLeadsCount,
      gradient: 'from-primary-500 to-primary-400',
      link: '/providers',
    },
  ];

  const quickActions = [
    { to: '/establishments/new', label: 'Add Establishment', gradient: 'from-blue-500 to-blue-600' },
    { to: '/users/new', label: 'Add User', gradient: 'from-green-500 to-green-600' },
    { to: '/delivery-men/new', label: 'Add Delivery Man', gradient: 'from-purple-500 to-purple-600' },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Link
            key={stat.title}
            to={stat.link}
            className="group"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-lg dark:hover:shadow-gray-900/50 transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className={`p-6 bg-linear-to-br ${stat.gradient} relative overflow-hidden`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
                <div className="relative">
                  <p className="text-white/80 text-sm font-medium">{stat.title}</p>
                  <p className="text-white text-4xl font-bold mt-1">{stat.value}</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.to}
                to={action.to}
                className={`inline-flex items-center gap-2 px-6 py-3 bg-linear-to-r ${action.gradient} text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium`}
              >
                <span>{action.label}</span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Recent Establishments</CardTitle>
          </CardHeader>
          <CardContent>
            {establishments && establishments.length > 0 ? (
              <div className="space-y-3">
                {establishments.slice(0, 5).map((est) => (
                  <Link
                    key={est.id}
                    to={`/establishments/${est.id}`}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">{est.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{est.whatsapp || est.website || 'No contact info'}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No establishments yet</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Pending Leads</CardTitle>
          </CardHeader>
          <CardContent>
            {leads && leads.length > 0 ? (
              <div className="space-y-3">
                {leads.filter(l => l.status === 'new').slice(0, 5).map((lead) => (
                  <Link
                    key={lead.id}
                    to="/providers"
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${lead.user_type === 'provider'
                        ? 'bg-linear-to-br from-primary-500/20 to-primary-400/20'
                        : 'bg-linear-to-br from-blue-500/20 to-indigo-600/20'
                      }`}>
                      <div className={`w-4 h-4 rounded-full ${lead.user_type === 'provider' ? 'bg-primary-500' : 'bg-blue-500'
                        }`}></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">{lead.name || lead.email}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{lead.phone}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No pending leads</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
