/**
 * Page Header Component
 */

import { ReactNode } from 'react'
import { PanelRight, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useSidebar } from '../contexts/sidebar-context'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  breadcrumbs?: { label: string; href?: string }[]
}

export function PageHeader({ title, subtitle, actions, breadcrumbs }: PageHeaderProps) {
  const { isOpen, toggle } = useSidebar()

  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="flex items-start gap-4">
        {/* Toggle button - only show when sidebar is closed */}
        {!isOpen && (
          <button
            onClick={toggle}
            className="p-2 transition-colors rounded-lg hover:bg-gray-200"
            aria-label="Abrir menu"
          >
            <PanelRight className="size-6 text-gray-800" />
          </button>
        )}

        <div>
          {breadcrumbs && (
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              {breadcrumbs.map((crumb, index) => (
                <div key={index} className="flex items-center gap-2">
                  {index > 0 && <ChevronRight className="size-3" />}
                  {crumb.href ? (
                    <Link to={crumb.href} className="hover:text-primary-600 transition-colors">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-gray-900 dark:text-gray-300 font-medium">
                      {crumb.label}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
          {!breadcrumbs && (
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
          )}
          {subtitle && (
            <p className="text-gray-600 dark:text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
      </div>

      {actions && <div>{actions}</div>}
    </div>
  )
}
