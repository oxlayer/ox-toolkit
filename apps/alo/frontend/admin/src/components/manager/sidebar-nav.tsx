import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { LayoutDashboard, ShoppingBag, Building2, Users, UserMinus, Wrench } from 'lucide-react'

interface NavItem {
  path: string
  label: string
  icon: typeof LayoutDashboard
}

const navItems: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/orders', label: 'Orders', icon: ShoppingBag },
  { path: '/providers', label: 'Providers', icon: Wrench },
  { path: '/establishments', label: 'Establishments', icon: Building2 },
  { path: '/users', label: 'Users', icon: Users },
  { path: '/delivery-men', label: 'Delivery Men', icon: UserMinus },
  { path: '/service-providers', label: 'Service Providers', icon: Wrench },
]

/**
 * Sidebar navigation component for manager portal
 */
export function SidebarNav() {
  const location = useLocation()

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-linear-to-b from-gray-900 to-gray-800 text-white p-6 shadow-2xl z-50">
      {/* Logo Section */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-primary-500 to-primary-400 shadow-primary">
            <span className="text-lg font-bold text-white">A</span>
          </div>
          <div>
            <h1 className="bg-linear-to-r from-white to-gray-300 bg-clip-text text-xl font-bold text-transparent">
              Alô
            </h1>
            <p className="text-xs text-gray-400">Manager Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
          const Icon = item.icon

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-linear-to-r from-primary-500 to-primary-400 text-white shadow-primary'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )}
            >
              <Icon className="size-4" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
