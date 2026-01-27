/**
 * Create Object Page
 *
 * Full page view for creating a new data object (e.g., Companies, People)
 * Allows users to define object name, icon, and initial fields.
 */

import { useState } from 'react';
import { ArrowLeft, ChevronRight, Database, Building2, Users, Target, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CreateObjectPageProps {
  onCancel: () => void;
  onSave: (object: {
    name: string;
    singular: string;
    plural: string;
    apiNameSingular: string;
    apiNamePlural: string;
    description?: string;
    icon: string;
  }) => void;
}

// Simplified icon options
const ICON_OPTIONS = [
  { id: 'building', name: 'Building', icon: 'building' },
  { id: 'users', name: 'Users', icon: 'users' },
  { id: 'briefcase', name: 'Briefcase', icon: 'briefcase' },
  { id: 'target', name: 'Target', icon: 'target' },
  { id: 'database', name: 'Database', icon: 'database' },
];

export function CreateObjectPage({ onCancel, onSave }: CreateObjectPageProps) {
  const [name, setName] = useState('');
  const [singular, setSingular] = useState('');
  const [plural, setPlural] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('building');

  // Auto-generate singular/plural from name
  const handleNameChange = (value: string) => {
    setName(value);
    if (!singular) setSingular(value);
    if (!plural) setPlural(value + 's');
  };

  // Generate API names (lowercase, underscored)
  const generateApiName = (displayName: string) => {
    return displayName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .trim();
  };

  const handleSave = () => {
    if (!name) return;

    const apiSingular = singular || generateApiName(name);
    const apiPlural = plural || generateApiName(name + 's');

    onSave({
      name,
      singular: singular || name,
      plural: plural || (name + 's'),
      apiNameSingular: apiSingular,
      apiNamePlural: apiPlural,
      description: description || undefined,
      icon: selectedIcon,
    });
  };

  const isValid = name.trim().length > 0;

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="px-10 py-8 pb-2 border-b">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="icon" onClick={onCancel} className="hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">Create New Object</h1>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <span>Workspace</span>
              <ChevronRight className="h-3 w-3" />
              <span>Objects</span>
              <ChevronRight className="h-3 w-3" />
              <span>New Object</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-10 py-8">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Object Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Object Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., Companies"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
            />
            <p className="text-xs text-gray-400 mt-1">Display name for your object</p>
          </div>

          {/* Singular and Plural */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Singular Form
              </label>
              <input
                type="text"
                value={singular}
                onChange={(e) => setSingular(e.target.value)}
                placeholder="e.g., Company"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
              />
              <p className="text-xs text-gray-400 mt-1">e.g., Company</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plural Form
              </label>
              <input
                type="text"
                value={plural}
                onChange={(e) => setPlural(e.target.value)}
                placeholder="e.g., Companies"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
              />
              <p className="text-xs text-gray-400 mt-1">e.g., Companies</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this object..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent resize-none"
            />
          </div>

          {/* Icon Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Icon
            </label>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map((icon) => (
                <button
                  key={icon.id}
                  onClick={() => setSelectedIcon(icon.id)}
                  className={`w-12 h-12 rounded-lg flex items-center justify-center border-2 transition-all ${
                    selectedIcon === icon.id
                      ? 'border-red-400 bg-red-50 text-red-600'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600'
                  }`}
                  title={icon.name}
                >
                  {icon.id === 'building' && <Building2 className="h-5 w-5" />}
                  {icon.id === 'users' && <Users className="h-5 w-5" />}
                  {icon.id === 'briefcase' && <Briefcase className="h-5 w-5" />}
                  {icon.id === 'target' && <Target className="h-5 w-5" />}
                  {icon.id === 'database' && <Database className="h-5 w-5" />}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-3">Preview</p>
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                {selectedIcon === 'building' && <Building2 className="h-5 w-5" />}
                {selectedIcon === 'users' && <Users className="h-5 w-5" />}
                {selectedIcon === 'briefcase' && <Briefcase className="h-5 w-5" />}
                {selectedIcon === 'target' && <Target className="h-5 w-5" />}
                {selectedIcon === 'database' && <Database className="h-5 w-5" />}
              </div>
              <div>
                <p className="font-medium text-gray-900">{name || 'Object Name'}</p>
                <p className="text-xs text-gray-500">{description || 'Description...'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t bg-gray-50 px-10 py-4 flex items-center justify-between">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={!isValid}
          className="bg-red-400 hover:bg-red-500 text-white"
        >
          Create Object
        </Button>
      </div>
    </div>
  );
}
