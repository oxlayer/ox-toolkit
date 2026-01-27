/**
 * Add Field View
 *
 * Multi-step flow for adding a new field to a data object.
 * Step 1: Select field type
 * Step 2: Configure field (icon, name, options)
 */

import { useState, useMemo } from 'react';
import { ArrowLeft, ChevronRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type FieldType =
  | 'text' | 'number' | 'boolean' | 'date' | 'datetime'
  | 'select' | 'multiselect' | 'rating' | 'currency'
  | 'email' | 'url' | 'phone' | 'address' | 'relation'
  | 'json' | 'array' | 'file';

interface FieldTypeInfo {
  type: FieldType;
  icon: string;
  label: string;
  description: string;
  category: 'basic' | 'advanced' | 'relation';
}

interface AddFieldViewProps {
  objectName: string;
  objectIcon?: string;
  onBack: () => void;
  onSave: (field: {
    name: string;
    label: string;
    type: FieldType;
    required: boolean;
    description?: string;
    options?: string[];
  }) => void;
}

// Field type definitions
const FIELD_TYPES: FieldTypeInfo[] = [
  // Basic
  { type: 'text', icon: 'Type', label: 'Text', description: 'Single line of text', category: 'basic' },
  { type: 'number', icon: 'Hash', label: 'Number', description: 'Numeric values', category: 'basic' },
  { type: 'boolean', icon: 'ToggleLeft', label: 'True/False', description: 'Yes or no', category: 'basic' },
  { type: 'datetime', icon: 'CalendarClock', label: 'Date and Time', description: 'Date with time', category: 'basic' },
  { type: 'date', icon: 'Calendar', label: 'Date', description: 'Date without time', category: 'basic' },
  { type: 'select', icon: 'List', label: 'Select', description: 'Single choice from list', category: 'basic' },
  { type: 'multiselect', icon: 'Tags', label: 'Multi-select', description: 'Multiple choices', category: 'basic' },
  { type: 'rating', icon: 'Star', label: 'Rating', description: 'Star rating', category: 'basic' },
  { type: 'currency', icon: 'DollarSign', label: 'Currency', description: 'Money values', category: 'basic' },
  { type: 'email', icon: 'Mail', label: 'Email', description: 'Email addresses', category: 'basic' },
  { type: 'url', icon: 'Link', label: 'Link', description: 'Website URLs', category: 'basic' },
  { type: 'phone', icon: 'Phone', label: 'Phone', description: 'Phone numbers', category: 'basic' },
  { type: 'address', icon: 'MapPin', label: 'Address', description: 'Street addresses', category: 'basic' },
  { type: 'file', icon: 'File', label: 'File', description: 'Upload files', category: 'basic' },
  // Advanced
  { type: 'json', icon: 'Code', label: 'JSON', description: 'Structured data', category: 'advanced' },
  { type: 'array', icon: 'Layers', label: 'Array', description: 'List of values', category: 'advanced' },
];

// Icon components
const Icons: Record<string, React.FC<{ className?: string }>> = {
  Type: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" x2="15" y1="20" y2="20"/><line x1="12" x2="12" y1="4" y2="20"/></svg>,
  Hash: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="4" x2="20" y1="9" y2="9"/><line x1="4" x2="20" y1="15" y2="15"/><line x1="10" x2="8" y1="3" y2="21"/><line x1="16" x2="14" y1="3" y2="21"/></svg>,
  ToggleLeft: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="2" y="4" width="20" height="16" rx="2"/><circle cx="8" cy="12" r="2"/></svg>,
  Calendar: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>,
  CalendarClock: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  List: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>,
  Tags: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/></svg>,
  Star: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  DollarSign: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  Mail: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>,
  Link: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  Phone: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  MapPin: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>,
  File: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>,
  Code: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
  Layers: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/></svg>,
};

type Step = 'select-type' | 'configure';

export function AddFieldView({ objectName, objectIcon, onBack, onSave }: AddFieldViewProps) {
  const [step, setStep] = useState<Step>('select-type');
  const [selectedType, setSelectedType] = useState<FieldType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'basic' | 'advanced'>('all');

  // Configure step state
  const [fieldName, setFieldName] = useState('');
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldDescription, setFieldDescription] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [isUnique, setIsUnique] = useState(false);
  const [wrapText, setWrapText] = useState(false);
  const [selectOptions, setSelectOptions] = useState('');

  const filteredTypes = useMemo(() => {
    return FIELD_TYPES.filter((type) => {
      const matchesSearch = searchQuery === '' ||
        type.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        type.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || type.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const handleSelectType = (type: FieldType) => {
    setSelectedType(type);
    setStep('configure');
  };

  const handleSave = () => {
    if (!selectedType || !fieldName) return;

    const options = selectOptions
      ? selectOptions.split(',').map(s => s.trim()).filter(Boolean)
      : undefined;

    onSave({
      name: fieldName,
      label: fieldLabel || fieldName,
      type: selectedType,
      required: isRequired,
      description: fieldDescription || undefined,
      options,
    });
  };

  const renderSelectTypeStep = () => (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Select a field type</h2>
        <p className="text-gray-500">Choose the type of field you want to add</p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search a type"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
        />
      </div>

      {/* Categories */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setSelectedCategory('all')}
          className={cn(
            'px-3 py-1.5 text-sm font-medium rounded-full transition-colors',
            selectedCategory === 'all'
              ? 'bg-red-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          All
        </button>
        <button
          onClick={() => setSelectedCategory('basic')}
          className={cn(
            'px-3 py-1.5 text-sm font-medium rounded-full transition-colors',
            selectedCategory === 'basic'
              ? 'bg-red-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          Basic
        </button>
        <button
          onClick={() => setSelectedCategory('advanced')}
          className={cn(
            'px-3 py-1.5 text-sm font-medium rounded-full transition-colors',
            selectedCategory === 'advanced'
              ? 'bg-red-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          Advanced
        </button>
      </div>

      {/* Field Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredTypes.map((fieldType) => {
          const Icon = Icons[fieldType.icon];
          return (
            <button
              key={fieldType.type}
              onClick={() => handleSelectType(fieldType.type)}
              className="p-4 border border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-all text-left group"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 group-hover:bg-red-100 flex items-center justify-center text-gray-600 group-hover:text-red-600 transition-colors shrink-0">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900">{fieldType.label}</p>
                  <p className="text-sm text-gray-500 truncate">{fieldType.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderConfigureStep = () => {
    const selectedTypeInfo = FIELD_TYPES.find(t => t.type === selectedType);
    const Icon = selectedTypeInfo ? Icons[selectedTypeInfo.icon] : null;

    return (
      <div className="max-w-3xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <span>Select a field type</span>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900">Configure field</span>
        </div>

        <div className="space-y-8">
          {/* Icon and Name */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Icon and Name</h2>
            <p className="text-sm text-gray-500 mb-4">The name and icon of this field</p>

            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg mb-4">
              <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                {Icon && <Icon className="h-6 w-6" />}
              </div>
              <div>
                <p className="font-medium text-gray-900">{selectedTypeInfo?.label}</p>
                <p className="text-sm text-gray-500">{selectedTypeInfo?.description}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Field Name</label>
                <input
                  type="text"
                  value={fieldName}
                  onChange={(e) => setFieldName(e.target.value)}
                  placeholder="e.g., employees"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
                />
                <p className="text-xs text-gray-400 mt-1">This will be used as the API name</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Display Label</label>
                <input
                  type="text"
                  value={fieldLabel}
                  onChange={(e) => setFieldLabel(e.target.value)}
                  placeholder="e.g., Employees"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={fieldDescription}
                  onChange={(e) => setFieldDescription(e.target.value)}
                  placeholder="Describe this field..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent resize-none"
                />
              </div>
            </div>
          </div>

          {/* Options based on field type */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Customization</h2>
            <p className="text-sm text-gray-500 mb-4">Customize field settings</p>

            <div className="space-y-4">
              {(selectedType === 'select' || selectedType === 'multiselect') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
                  <input
                    type="text"
                    value={selectOptions}
                    onChange={(e) => setSelectOptions(e.target.value)}
                    placeholder="Option 1, Option 2, Option 3"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-400 mt-1">Comma-separated values</p>
                </div>
              )}

              {/* Toggle options */}
              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-900">Required</p>
                    <p className="text-sm text-gray-500">This field must be filled</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isRequired}
                    onChange={(e) => setIsRequired(e.target.checked)}
                    className="w-5 h-5 text-red-500 rounded focus:ring-red-400"
                  />
                </label>

                <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-900">Unique</p>
                    <p className="text-sm text-gray-500">Prevent duplicate values</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isUnique}
                    onChange={(e) => setIsUnique(e.target.checked)}
                    className="w-5 h-5 text-red-500 rounded focus:ring-red-400"
                  />
                </label>

                {selectedType === 'text' && (
                  <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-900">Wrap on record pages</p>
                      <p className="text-sm text-gray-500">Display text on multiple lines</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={wrapText}
                      onChange={(e) => setWrapText(e.target.checked)}
                      className="w-5 h-5 text-red-500 rounded focus:ring-red-400"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Preview</h3>
            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded bg-red-100 flex items-center justify-center text-red-600">
                  {Icon && <Icon className="h-4 w-4" />}
                </div>
                <span className="text-gray-900">{objectName}</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 w-24">{fieldLabel || 'Field Name'}:</span>
                  <span className="text-sm text-gray-400">
                    {selectedType === 'text' && 'Lorem ipsum dolor sit amet...'}
                    {selectedType === 'number' && '1,234'}
                    {selectedType === 'boolean' && 'Yes'}
                    {selectedType === 'date' && '2024-01-15'}
                    {selectedType === 'email' && 'example@email.com'}
                    {selectedType === 'currency' && '$1,234.56'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="px-10 py-8 pb-2 border-b">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">
              {step === 'select-type' ? 'New Field' : 'Configure Field'}
            </h1>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <span>Workspace</span>
              <ChevronRight className="h-3 w-3" />
              <span>Objects</span>
              <ChevronRight className="h-3 w-3" />
              <span>{objectName}</span>
              <ChevronRight className="h-3 w-3" />
              <span>New Field</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-10 py-8">
        {step === 'select-type' ? renderSelectTypeStep() : renderConfigureStep()}
      </div>

      {/* Footer */}
      {step === 'configure' && (
        <div className="border-t bg-gray-50 px-10 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setStep('select-type')}
          >
            Back
          </Button>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={onBack}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!fieldName}
              className="bg-red-400 hover:bg-red-500 text-white"
            >
              Save
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
