/**
 * Organization Settings Page
 */

import { useState } from 'react'
import { CardTech, InputTech, LabelTech, ButtonTech as TechButton } from '@acme/ui'
import { PageHeader } from '@/components/page-header'
import { Users, UserPlus, Mail, MoreVertical, Shield, Crown } from 'lucide-react'

interface TeamMember {
  id: string
  name: string
  email: string
  role: 'owner' | 'admin' | 'member'
  status: 'active' | 'pending'
  joinedAt: string
}

const mockTeamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'João Silva',
    email: 'joao@exemplo.com',
    role: 'owner',
    status: 'active',
    joinedAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'Maria Santos',
    email: 'maria@exemplo.com',
    role: 'admin',
    status: 'active',
    joinedAt: '2024-02-20',
  },
]

export default function OrganizationPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(mockTeamMembers)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member')
  const [isInviting, setIsInviting] = useState(false)
  const [showInviteForm, setShowInviteForm] = useState(false)

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    setIsInviting(true)

    // Simulate API call
    setTimeout(() => {
      const newMember: TeamMember = {
        id: Date.now().toString(),
        name: inviteEmail.split('@')[0],
        email: inviteEmail,
        role: inviteRole,
        status: 'pending',
        joinedAt: new Date().toISOString().split('T')[0],
      }

      setTeamMembers([...teamMembers, newMember])
      setInviteEmail('')
      setInviteRole('member')
      setShowInviteForm(false)
      setIsInviting(false)
    }, 1000)
  }

  const handleRemoveMember = (id: string) => {
    if (confirm('Tem certeza que deseja remover este membro?')) {
      setTeamMembers(teamMembers.filter(m => m.id !== id))
    }
  }

  const handleResendInvite = (id: string) => {
    console.log('Resend invite to:', id)
    // TODO: Implement resend invite
  }

  const getRoleBadge = (role: TeamMember['role']) => {
    switch (role) {
      case 'owner':
        return (
          <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            <Crown className="size-3" />
            Dono
          </span>
        )
      case 'admin':
        return (
          <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
            <Shield className="size-3" />
            Admin
          </span>
        )
      case 'member':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            Membro
          </span>
        )
    }
  }

  const getStatusBadge = (status: TeamMember['status']) => {
    if (status === 'pending') {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
          Pendente
        </span>
      )
    }
    return (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
        Ativo
      </span>
    )
  }

  return (
    <div className="max-w-5xl space-y-6">
      <PageHeader
        title="Organização"
        subtitle="Gerencie seu time e convide novas pessoas."
        breadcrumbs={[
          { label: 'Configurações', href: '/settings' },
          { label: 'Organização' },
        ]}
      />

      {/* Team Members */}
      <CardTech className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Users className="size-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Equipe
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {teamMembers.length} membro{teamMembers.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <TechButton
            variant="outline"
            onClick={() => setShowInviteForm(!showInviteForm)}
            className="gap-2"
          >
            <UserPlus className="size-4" />
            Convidar
          </TechButton>
        </div>

        {/* Invite Form */}
        {showInviteForm && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
              Convidar novo membro
            </h3>
            <form onSubmit={handleSendInvite} className="flex items-end gap-3">
              <div className="flex-1">
                <LabelTech htmlFor="invite-email">E-mail</LabelTech>
                <InputTech
                  id="invite-email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  required
                  disabled={isInviting}
                />
              </div>
              <div>
                <LabelTech htmlFor="invite-role">Função</LabelTech>
                <select
                  id="invite-role"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member')}
                  className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={isInviting}
                >
                  <option value="member">Membro</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <TechButton
                type="submit"
                variant="solid"
                disabled={isInviting || !inviteEmail.trim()}
              >
                {isInviting ? 'Enviando...' : 'Enviar Convite'}
              </TechButton>
            </form>
          </div>
        )}

        {/* Members List */}
        <div className="space-y-3">
          {teamMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-semibold">
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {member.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {member.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {getRoleBadge(member.role)}
                  {getStatusBadge(member.status)}
                </div>
                <div className="flex items-center gap-1">
                  {member.status === 'pending' && (
                    <button
                      onClick={() => handleResendInvite(member.id)}
                      className="p-2 text-gray-400 hover:text-primary-500 transition-colors"
                      title="Reenviar convite"
                    >
                      <Mail className="size-4" />
                    </button>
                  )}
                  {member.role !== 'owner' && (
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      title="Remover membro"
                    >
                      <MoreVertical className="size-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {teamMembers.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Nenhum membro na equipe ainda.
              </p>
              <TechButton
                variant="outline"
                onClick={() => setShowInviteForm(true)}
                className="mt-4"
              >
                <UserPlus className="size-4 mr-2" />
                Convidar primeiro membro
              </TechButton>
            </div>
          )}
        </div>
      </CardTech>

      {/* Roles Info */}
      <CardTech className="p-6 bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3">
          Sobre as funções
        </h3>
        <div className="space-y-2 text-sm text-blue-800 dark:text-blue-400">
          <p><strong>Dono:</strong> Controle total da organização. Apenas um dono por organização.</p>
          <p><strong>Admin:</strong> Pode gerenciar membros, configurações e ver todos os dados.</p>
          <p><strong>Membro:</strong> Acesso limitado às funcionalidades básicas.</p>
        </div>
      </CardTech>
    </div>
  )
}
