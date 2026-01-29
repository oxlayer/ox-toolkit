
/**
 * Settings Page - Umbrella view for all configurations
 */

import { Link } from 'react-router-dom'
import { User, Clock, Tag, MessageSquare, Users, Zap, Workflow, ChevronRight } from 'lucide-react'
import { CardTech } from '@acme/ui'
import { PageHeader } from '@/components/page-header'

const settingsSections = [
  {
    title: 'Perfil',
    description: 'Gerencie suas informações pessoais e de contato',
    icon: User,
    href: '/settings/profile',
    color: 'bg-blue-500',
  },
  {
    title: 'Horário de Atendimento',
    description: 'Configure seus dias e horários de funcionamento',
    icon: Clock,
    href: '/settings/hours',
    color: 'bg-green-500',
  },
  {
    title: 'Organização',
    description: 'Gerencie seu time e convide novas pessoas',
    icon: Users,
    href: '/settings/organization',
    color: 'bg-indigo-500',
  },
  {
    title: 'Integrações',
    description: 'Configure email, WhatsApp e outras integrações',
    icon: Zap,
    href: '/settings/integrations',
    color: 'bg-amber-500',
  },
  {
    title: 'Automação',
    description: 'Crie fluxos de automação para mensagens e agendamentos',
    icon: Workflow,
    href: '/settings/automation',
    color: 'bg-rose-500',
  },
  {
    title: 'Etiquetas',
    description: 'Crie etiquetas para organizar seus contatos e conversas',
    icon: Tag,
    href: '/settings/labels',
    color: 'bg-purple-500',
  },
  {
    title: 'Respostas Rápidas',
    description: 'Configure mensagens predefinidas para agilizar o atendimento',
    icon: MessageSquare,
    href: '/settings/quick-replies',
    color: 'bg-orange-500',
  },
]

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        subtitle="Gerencie todos os aspectos do seu negócio."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {settingsSections.map((section) => (
          <Link key={section.href} to={section.href}>
            <CardTech className="p-6 transition-all hover:shadow-md hover:border-primary-200 dark:hover:border-primary-800 group h-full">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${section.color} bg-opacity-10 dark:bg-opacity-20`}>
                  <section.icon className={`w-6 h-6 text-gray-200`} />
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-colors" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {section.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {section.description}
              </p>
            </CardTech>
          </Link>
        ))}
      </div>
    </div>
  )
}
