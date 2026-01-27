/**
 * Object Detail View
 *
 * Allows users to configure a data object (e.g., Companies, People)
 * with two main tabs: Fields and Settings
 */

import { useState } from 'react';
import { ArrowLeft, Settings as SettingsIcon, Database, Trash2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DataField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'boolean' | 'date' | 'datetime' | 'select' | 'multiselect' | 'relation' | 'file' | 'email' | 'url' | 'phone' | 'address' | 'currency' | 'rating' | 'json' | 'array';
  label: string;
  required: boolean;
  description?: string;
  options?: string[];
  relationObject?: string;
  relationType?: 'belongs_to' | 'has_many';
  deactivated?: boolean;
  app: 'Managed' | 'Custom';
}

interface DataObject {
  id: string;
  name: string;
  singular: string;
  plural: string;
  apiNameSingular: string;
  apiNamePlural: string;
  description?: string;
  icon?: string;
  recordLabelField?: string;
  recordImageField?: string;
  fields: DataField[];
  relations: DataField[];
  createdAt: string;
}

interface ObjectDetailViewProps {
  object: DataObject;
  onBack: () => void;
  onNavigateToAddField: () => void;
  onObjectChange?: (object: DataObject) => void;
}

export function ObjectDetailView({ object, onBack, onNavigateToAddField, onObjectChange }: ObjectDetailViewProps) {
  const [activeTab, setActiveTab] = useState<'fields' | 'settings'>('fields');
  const [searchQuery, setSearchQuery] = useState('');

  const renderSettingsTab = () => (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* About Section */}
      <div>
        <h2 className="text-lg font-semibold mb-4">About</h2>
        <p className="text-sm text-gray-500 mb-6">Name in both singular (e.g., 'Invoice') and plural (e.g., 'Invoices') forms.</p>

        <div className="space-y-6">
          {/* Icon Selection - Simplified */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center text-red-600 border-2 border-red-400">
                <Database className="h-5 w-5" />
              </div>
              <span className="text-sm text-gray-500">{object.icon || 'Database'}</span>
            </div>
          </div>

          {/* Singular Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Singular</label>
              <input
                type="text"
                value={object.singular}
                onChange={(e) => onObjectChange?.({ ...object, singular: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
                placeholder="e.g., Company"
              />
              <p className="text-xs text-gray-400 mt-1">A {object.singular?.toLowerCase() || 'record'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Plural</label>
              <input
                type="text"
                value={object.plural}
                onChange={(e) => onObjectChange?.({ ...object, plural: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
                placeholder="e.g., Companies"
              />
            </div>
          </div>

          {/* API Names (read-only) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">API Name (Singular)</label>
              <input
                type="text"
                value={object.apiNameSingular}
                readOnly
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">API Name (Plural)</label>
              <input
                type="text"
                value={object.apiNamePlural}
                readOnly
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Options Section */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Options</h2>
        <p className="text-sm text-gray-500 mb-6">Choose the fields that will identify your records</p>

        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded bg-red-100 flex items-center justify-center text-red-600">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{object.singular}</p>
              <p className="text-sm text-gray-500">Managed</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Record label</label>
            <select
              value={object.recordLabelField || ''}
              onChange={(e) => onObjectChange?.({ ...object, recordLabelField: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
            >
              <option value="">Select a field...</option>
              {object.fields.filter(f => !f.deactivated).map((field) => (
                <option key={field.id} value={field.id}>{field.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Record image</label>
            <select
              value={object.recordImageField || ''}
              onChange={(e) => onObjectChange?.({ ...object, recordImageField: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
            >
              <option value="">None</option>
              {object.fields.filter(f => !f.deactivated && f.type === 'file').map((field) => (
                <option key={field.id} value={field.id}>{field.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="border border-red-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-red-600 mb-2">Danger zone</h2>
        <p className="text-sm text-gray-500 mb-4">Once you deactivate an object, there is no going back. Please be certain.</p>
        <Button
          variant="outline"
          className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Deactivate object
        </Button>
      </div>
    </div>
  );

  const renderFieldsTab = () => (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Relations Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Relations</h2>
            <p className="text-sm text-gray-500">Relation between this object and other objects</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search a relation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
          />
        </div>

        {/* Relations List */}
        <div className="space-y-2">
          {object.relations
            .filter(r => !r.deactivated && (searchQuery === '' || r.label.toLowerCase().includes(searchQuery.toLowerCase())))
            .map((relation) => (
              <div
                key={relation.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{relation.label}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>{relation.relationObject || 'Related object'}</span>
                      <span>•</span>
                      <span>{relation.relationType === 'belongs_to' ? 'Belongs to one' : 'Has many'}</span>
                    </div>
                  </div>
                </div>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{relation.app}</span>
              </div>
            ))}
        </div>

        <button className="mt-4 w-full flex items-center justify-center gap-2 p-3 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-colors">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add relation
        </button>
      </div>

      {/* Fields Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Fields</h2>
            <p className="text-sm text-gray-500">Customise the fields available in the {object.singular} views</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search a field..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
          />
        </div>

        {/* Fields List */}
        <div className="space-y-2">
          {object.fields
            .filter(f => !f.deactivated && (searchQuery === '' || f.label.toLowerCase().includes(searchQuery.toLowerCase())))
            .map((field) => (
              <div
                key={field.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">{field.label.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{field.label}</p>
                    <p className="text-sm text-gray-500">{field.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{field.app}</span>
                  <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded transition-opacity">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
        </div>

        <button
          onClick={onNavigateToAddField}
          className="mt-4 w-full flex items-center justify-center gap-2 p-3 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-colors"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Field
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="px-10 py-8 pb-2 border-b">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <Database className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900">{object.name}</h1>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <span>Workspace</span>
                <ChevronRight className="h-3 w-3" />
                <span>Objects</span>
                <ChevronRight className="h-3 w-3" />
                <span>{object.name}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-4 border-b">
          <button
            onClick={() => setActiveTab('fields')}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              activeTab === 'fields'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            Fields
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              activeTab === 'settings'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            <SettingsIcon className="h-4 w-4 mr-1 inline" />
            Settings
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-10 py-8">
        {activeTab === 'fields' ? renderFieldsTab() : renderSettingsTab()}
      </div>
    </div>
  );
}
