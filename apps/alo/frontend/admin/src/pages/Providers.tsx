import { useState } from 'react';
import { Card, CardContent } from '@acme/ui';
import {
  useOnboardingLeads,
  useUpdateOnboardingLead,
  useDeleteOnboardingLead,
} from '../hooks/use-onboarding-leads';
import type { OnboardingLead, OnboardingLeadStatus, OnboardingLeadUserType } from '../types';

type StatusFilter = 'all' | OnboardingLeadStatus;
type TypeFilter = 'all' | OnboardingLeadUserType;

const typeLabels: Record<OnboardingLeadUserType, string> = {
  provider: 'Local Provider',
  company: 'Company',
};

export default function Providers() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [notesModal, setNotesModal] = useState<{ lead: OnboardingLead; notes: string } | null>(null);

  const { data: leads, isLoading } = useOnboardingLeads();
  const updateMutation = useUpdateOnboardingLead();
  const deleteMutation = useDeleteOnboardingLead();

  const handleStatusChange = (lead: OnboardingLead, newStatus: OnboardingLeadStatus) => {
    updateMutation.mutate(
      {
        id: lead.id,
        input: {
          status: newStatus,
        },
      },
      {
        onSuccess: () => setNotesModal(null),
      }
    );
  };

  const filteredLeads = leads?.filter((lead) => {
    if (statusFilter !== 'all' && lead.status !== statusFilter) return false;
    if (typeFilter !== 'all' && lead.user_type !== typeFilter) return false;
    return true;
  });

  const pendingCount = leads?.filter((l) => l.status === 'new').length || 0;

  const getAvatar = (lead: OnboardingLead) => {
    const name = lead.user_type === 'provider' ? lead.name : lead.establishment_type_name || lead.category_name || '?';
    return {
      initial: (name?.charAt(0) || '?').toUpperCase(),
      from: lead.user_type === 'provider' ? 'from-primary-500 to-primary-400' : 'from-blue-500 to-indigo-600',
    };
  };

  const getDisplayName = (lead: OnboardingLead) => {
    if (lead.user_type === 'provider' && lead.name) {
      return lead.name;
    }
    if (lead.user_type === 'company' && lead.establishment_type_name) {
      return `${lead.establishment_type_name} - ${lead.document}`;
    }
    return lead.email;
  };

  const getCategoryInfo = (lead: OnboardingLead) => {
    if (lead.user_type === 'provider') {
      return lead.category?.name || lead.category_name || 'N/A';
    }
    return lead.establishment_type?.name || lead.establishment_type_name || 'N/A';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Leads</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerencia e faça o follow-up de leads
          </p>
        </div>
        {pendingCount > 0 && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-linear-to-r from-primary-500 to-primary-400 text-white rounded-xl font-semibold shadow-primary">
            <span>{pendingCount} new {pendingCount === 1 ? 'lead' : 'leads'} pending</span>
          </div>
        )}
      </div>

      {/* Filters */}
      <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Filter by Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
                className="w-full sm:w-auto border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              >
                <option value="all">All Types</option>
                <option value="provider">Local Providers</option>
                <option value="company">Companies</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Filter by Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="w-full sm:w-auto border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              >
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="converted">Converted</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Lead
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredLeads?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <p>No leads found matching your filters.</p>
                  </td>
                </tr>
              ) : (
                filteredLeads?.map((lead: OnboardingLead) => {
                  const avatar = getAvatar(lead);
                  return (
                    <tr key={lead.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-12 w-12 rounded-xl bg-linear-to-br ${avatar.from} flex items-center justify-center text-white font-bold shadow-lg`}>
                            {avatar.initial}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">{getDisplayName(lead)}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">ID: {lead.id}</div>
                            {lead.notes && (
                              <div className="text-xs text-primary-600 dark:text-primary-400 mt-1 flex items-center gap-1">
                                <div className="w-1 h-1 rounded-full bg-primary-600 dark:bg-primary-400"></div>
                                <span className="truncate max-w-[150px]">{lead.notes}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${lead.userType === 'provider'
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                          }`}>
                          <span>{typeLabels[lead.userType]}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {getCategoryInfo(lead)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="text-gray-900 dark:text-white font-medium">{lead.phone}</div>
                          <div className="text-gray-500 dark:text-gray-400">{lead.email}</div>
                          <div className="text-xs text-gray-400 dark:text-gray-500">Doc: {lead.document}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={lead.status}
                          onChange={(e) => handleStatusChange(lead, e.target.value as OnboardingLeadStatus)}
                          className="px-3 py-1.5 rounded-full text-xs font-semibold border-0 cursor-pointer focus:ring-2 focus:ring-primary-500"
                          disabled={updateMutation.isPending}
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="converted">Converted</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setNotesModal({ lead, notes: lead.notes || '' })}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            title={lead.notes || 'Add notes'}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this lead?')) {
                                deleteMutation.mutate(lead.id);
                              }
                            }}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            disabled={deleteMutation.isPending}
                            title="Delete"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Drawer */}
      {notesModal && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fade-in"
            onClick={() => setNotesModal(null)}
          />

          {/* Drawer */}
          <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white dark:bg-gray-900 shadow-2xl z-50 animate-slide-in-right">
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-800">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Lead Details</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Manage lead information</p>
                </div>
                <button
                  onClick={() => setNotesModal(null)}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500 dark:text-gray-400"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                {/* Lead Info Card */}
                <div className="bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`h-16 w-16 rounded-2xl bg-linear-to-br ${notesModal.lead.user_type === 'provider' ? 'from-primary-500 to-primary-400' : 'from-blue-500 to-indigo-600'
                      } flex items-center justify-center text-gray-800 dark:text-white font-bold text-2xl shadow-primary`}>
                      {(getDisplayName(notesModal.lead)?.charAt(0) || '?').toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white text-lg">{getDisplayName(notesModal.lead)}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">ID: {notesModal.lead.id}</p>
                    </div>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                      <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="flex-1 truncate">{notesModal.lead.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                      <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 8V5z" />
                        </svg>
                      </div>
                      <span>{notesModal.lead.phone}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                      <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <span className="font-mono text-xs">{notesModal.lead.document}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                      <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center">
                        <div className={`w-4 h-4 rounded-full ${notesModal.lead.userType === 'provider' ? 'bg-red-500' : 'bg-blue-500'
                          }`}></div>
                      </div>
                      <span className="font-medium">{typeLabels[notesModal.lead.userType]}</span>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Status</label>
                  <select
                    value={notesModal.lead.status}
                    onChange={(e) => setNotesModal({
                      ...notesModal,
                      lead: { ...notesModal.lead, status: e.target.value as OnboardingLeadStatus }
                    })}
                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all font-medium"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="converted">Converted</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Notes</label>
                  <textarea
                    value={notesModal.notes}
                    onChange={(e) => setNotesModal({ ...notesModal, notes: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none"
                    rows={6}
                    placeholder="Add notes about this lead..."
                  />
                </div>

                {/* Timeline Info */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-3 text-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 dark:text-gray-400">Created</span>
                    <span className="text-gray-900 dark:text-white font-medium">{new Date(notesModal.lead.created_at).toLocaleDateString()}</span>
                  </div>
                  {notesModal.lead.contacted_at && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 dark:text-gray-400">Contacted</span>
                      <span className="text-gray-900 dark:text-white font-medium">{new Date(notesModal.lead.contacted_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex gap-3">
                <button
                  onClick={() => setNotesModal(null)}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (notesModal) {
                      updateMutation.mutate(
                        {
                          id: notesModal.lead.id,
                          input: {
                            status: notesModal.lead.status,
                            notes: notesModal.notes,
                          },
                        },
                        {
                          onSuccess: () => setNotesModal(null),
                        }
                      );
                    }
                  }}
                  disabled={updateMutation.isPending}
                  className="flex-1 px-4 py-3 bg-linear-to-r from-primary-500 to-primary-400 text-white rounded-xl hover:shadow-primary transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
