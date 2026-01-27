import { type ReactNode } from 'react'
import { Outlet } from 'react-router-dom'
import { SidebarNav } from './sidebar-nav'
import { ThemeSwitcher } from '@acme/ui'

interface ManagerLayoutProps {
  children?: ReactNode
}

/**
 * Main layout component for the manager portal
 * Provides sidebar navigation and main content area
 */
export function ManagerLayout({ children }: ManagerLayoutProps) {
  const content = children ?? <Outlet />

  return (
    <div className="min-h-screen bg-surface transition-colors">
      {/* Sidebar */}
      <SidebarNav />

      {/* Main content */}
      <main className="ml-64 min-h-screen">
        {/* Header with theme switcher */}
        <header className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur-sm">
          <div className="flex h-14 items-center justify-end px-6">
            <ThemeSwitcher />
          </div>
        </header>

        {/* Page content */}
        <div className="p-8">{content}</div>
      </main>
    </div>
  )
}
