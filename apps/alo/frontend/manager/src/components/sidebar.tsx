/**
 * Sidebar Navigation
 */

import { NavLink } from 'react-router-dom'
import {
  Home,
  Wrench,
  Package,
  Calendar,
  MessageSquare,
  User,
  LogOut,
  Settings,
} from 'lucide-react'

import { NotificationDrawer } from './notification-drawer'
import { useApp } from '../contexts/app-context'

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  featureFlag?: keyof ReturnType<typeof import('../types').getFeatureFlagsForType>
}

const navigation: NavigationItem[] = [
  { name: 'Início', href: '/', icon: Home },
  { name: 'Serviços', href: '/services', icon: Wrench, featureFlag: 'hasServices' },
  { name: 'Produtos', href: '/products', icon: Package, featureFlag: 'hasProducts' },
  { name: 'Agenda', href: '/agenda', icon: Calendar, featureFlag: 'hasAgenda' },
  { name: 'Chat', href: '/chats', icon: MessageSquare, featureFlag: 'hasChat' },
  { name: 'Perfil', href: '/profile', icon: User },
]

export function Sidebar() {
  const { profile, featureFlags } = useApp()

  // Filter navigation based on feature flags
  const filteredNavigation = navigation.filter((item) => {
    if (!item.featureFlag) return true
    return featureFlags[item.featureFlag]
  })

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col">
      {/* Logo */}
      <div className="mb-4">
        <div className="p-6 flex items-center justify-center" style={{ flexDirection: 'column' }}>
          <img src="/logo.svg" alt="Alô" className="h-24 w-24" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {filteredNavigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.href === '/'}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
              ${isActive
                ? 'bg-primary-600 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }
            `}
          >
            <item.icon className="size-5" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 space-y-1">

        <NavLink
          to="/settings"
          className={({ isActive }) => `
            flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
            ${isActive
              ? 'bg-primary-600 text-white'
              : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }
          `}
        >
          <Settings className="size-5" />
          <span>Configurações</span>
        </NavLink>
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
          <LogOut className="size-5" />
          <span>Sair</span>
        </button>
      </div>

      {/* User Info */}
      {profile && (
        <div className="p-4 bg-gray-800/50">
          <div className="flex items-center gap-3">

            <NotificationDrawer />
            <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {profile.name}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {profile.type === 'service_provider' ? 'Prestador de Serviços' : 'Empresa'}
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
