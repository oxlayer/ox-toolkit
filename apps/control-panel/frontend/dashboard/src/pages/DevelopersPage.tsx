/**
 * Developers Page
 *
 * Manage developers - view, create, edit, delete
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { controlPanelApi, type CreateOrganizationInput } from '@/services/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatDate, formatRelativeTime } from '@/utils/format';

export function DevelopersPage() {
  const { data: organizations, isLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => controlPanelApi.organizations.list(),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Developers
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage developers and their access to SDK packages
          </p>
        </div>
        <Button>
          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Developer
        </Button>
      </div>

      {/* Developers list */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
              Loading...
            </div>
          ) : organizations?.data && organizations.data.length > 0 ? (
            <div className="divide-y divide-gray-100 dark:divide-slate-800/50">
              {organizations.data.map((org) => (
                <div key={org.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {org.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {org.slug} • {org.maxDevelopers} developers max
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      View Developers
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                No developers yet
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Add developers to organizations to get started.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
