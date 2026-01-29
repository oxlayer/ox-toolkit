/**
 * Sidebar Navigation
 */

import { NavLink, useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import {
  LayoutDashboard,
  Wrench,
  Package,
  Calendar,
  MessageSquare,
  LogOut,
  Settings,
  PanelLeft,
  User,
  ChevronDown,
  Users,
} from 'lucide-react'

import { NotificationDrawer } from './notification-drawer'
import { useApp } from '../contexts/app-context'
import { useSidebar } from '../contexts/sidebar-context'

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  featureFlag?: keyof ReturnType<typeof import('../types').getFeatureFlagsForType>
}

const navigation: NavigationItem[] = [
  { name: 'Conversas', href: '/', icon: MessageSquare, featureFlag: 'hasChat' },
  { name: 'Agenda', href: '/agenda', icon: Calendar, featureFlag: 'hasAgenda' },
  { name: 'Clientes', href: '/clients', icon: Users },
  { name: 'Relatórios', href: '/reports', icon: LayoutDashboard },
  { name: 'Serviços', href: '/services', icon: Wrench, featureFlag: 'hasServices' },
  { name: 'Produtos', href: '/products', icon: Package, featureFlag: 'hasProducts' },
]

export function Sidebar() {
  const { profile, featureFlags } = useApp()
  const { isOpen, toggle, close } = useSidebar()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Filter navigation based on feature flags
  const filteredNavigation = navigation.filter((item) => {
    if (!item.featureFlag) return true
    return featureFlags[item.featureFlag]
  })

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [userMenuOpen])

  return (
    <>
      {/* Sidebar */}
      {isOpen && (
        <>
          <aside className="fixed inset-y-0 left-0 z-50 w-76 bg-gray-900 text-white flex flex-col lg:relative lg:z-0">
            {/* Header with Logo and Close Button */}
            <div className="relative flex items-center justify-center p-4 mb-2">
              <button>
                <img src="/logo.svg" alt="Alô" className="h-30 w-30" />
              </button>
              <button
                onClick={toggle}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Fechar menu"
              >
                <PanelLeft className="size-6" />
              </button>
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

            {/* User Info */}
            {profile && (
              <div className="p-4 bg-gray-800/50 relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="w-full flex items-center gap-3 hover:bg-gray-700/50 rounded-lg p-2 -m-2 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/80 flex items-center justify-center text-white font-semibold flex-shrink-0">
                    {profile.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium text-white truncate">
                      {profile.name}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {profile.type === 'service_provider' ? 'Prestador de Serviços' : 'Empresa'}
                    </p>
                  </div>
                  <ChevronDown className={`size-4 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* User Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute bottom-full left-4 right-4 mb-2 bg-gray-800 rounded-lg shadow-xl border border-gray-700 overflow-hidden z-10">
                    <NavLink
                      to="/settings/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                    >
                      <User className="size-4" />
                      <span>Meu Perfil</span>
                    </NavLink>
                    <NavLink
                      to="/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                    >
                      <Settings className="size-4" />
                      <span>Configurações</span>
                    </NavLink>
                    <div className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
                      <NotificationDrawer />
                      <span>Notificações</span>
                    </div>
                    <div className="border-t border-gray-700" />
                    <button
                      onClick={() => {
                        setUserMenuOpen(false)
                        // TODO: Implement logout
                        console.log('Logout')
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-gray-700 hover:text-red-300 transition-colors"
                    >
                      <LogOut className="size-4" />
                      <span>Sair</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </aside>

          {/* Overlay for mobile */}
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={close}
          />
        </>
      )}
    </>
  )
}
