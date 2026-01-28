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
  { path: '/orders', label: 'Pedidos', icon: ShoppingBag },
  { path: '/providers', label: 'Fornecedores', icon: Wrench },
  { path: '/establishments', label: 'Estabelecimentos', icon: Building2 },
  { path: '/users', label: 'Usuários', icon: Users },
  { path: '/delivery-men', label: 'Entregadores', icon: UserMinus },
  { path: '/service-providers', label: 'Provedores de Serviços', icon: Wrench },
]

/**
 * Sidebar navigation component for manager portal
 */
export function SidebarNav() {
  const location = useLocation()

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-linear-to-b from-gray-900 to-gray-800 text-white p-6 shadow-2xl z-50">
      {/* Logo Section */}
      <div className="mb-4">
        <div className="flex items-center justify-center">
          <img src="/logo.svg" alt="Alô" className="h-24 w-24" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
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
