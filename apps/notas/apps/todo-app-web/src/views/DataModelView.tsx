/**
 * Data Model View
 *
 * Allows users to create custom data models with fields and relationships.
 * This enables creating custom app templates for their projects.
 *
 * Handles navigation between:
 * - Main objects list
 * - Object detail view (Fields/Settings tabs)
 * - Add field flow
 */

import { useState } from 'react';
import { Database, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ObjectDetailView } from './data-model/ObjectDetailView';
import { AddFieldView } from './data-model/AddFieldView';
import { CreateObjectPage } from './data-model/CreateObjectPage';

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

const MOCK_OBJECTS: DataObject[] = [
  {
    id: 'companies',
    name: 'Companies',
    singular: 'Company',
    plural: 'Companies',
    apiNameSingular: 'company',
    apiNamePlural: 'companies',
    description: 'Empresas e organizações',
    icon: 'Building2',
    recordLabelField: 'name',
    fields: [
      { id: 'name', name: 'name', type: 'text', label: 'Name', required: true, app: 'Managed' },
      { id: 'domain', name: 'domain', type: 'text', label: 'Domain Name', required: false, app: 'Managed' },
      { id: 'employees', name: 'employees', type: 'number', label: 'Employees', required: false, app: 'Managed' },
      { id: 'arr', name: 'arr', type: 'currency', label: 'ARR', required: false, app: 'Managed' },
      { id: 'created_at', name: 'created_at', type: 'date', label: 'Creation date', required: false, app: 'Managed' },
      { id: 'updated_at', name: 'updated_at', type: 'date', label: 'Last update', required: false, app: 'Managed' },
    ],
    relations: [
      { id: 'r1', name: 'account_owner', type: 'relation', label: 'Account Owner', relationType: 'belongs_to', relationObject: 'users', required: false, app: 'Managed' as const },
      { id: 'r2', name: 'opportunities', type: 'relation', label: 'Opportunities', relationType: 'has_many', relationObject: 'opportunities', required: false, app: 'Managed' as const },
      { id: 'r3', name: 'people', type: 'relation', label: 'People', relationType: 'has_many', relationObject: 'people', required: false, app: 'Managed' as const },
      { id: 'r4', name: 'tasks', type: 'relation', label: 'Tasks', relationType: 'has_many', relationObject: 'tasks', required: false, app: 'Managed' as const },
    ],
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'people',
    name: 'People',
    singular: 'Person',
    plural: 'People',
    apiNameSingular: 'person',
    apiNamePlural: 'people',
    description: 'Pessoas e contatos',
    icon: 'Users',
    recordLabelField: 'name',
    fields: [
      { id: 'name', name: 'name', type: 'text', label: 'Name', required: true, app: 'Managed' },
      { id: 'email', name: 'email', type: 'email', label: 'Email', required: false, app: 'Managed' },
      { id: 'phone', name: 'phone', type: 'phone', label: 'Phone', required: false, app: 'Managed' },
      { id: 'linkedin', name: 'linkedin', type: 'url', label: 'Linkedin', required: false, app: 'Managed' },
      { id: 'created_at', name: 'created_at', type: 'date', label: 'Created by', required: false, app: 'Managed' },
      { id: 'updated_at', name: 'updated_at', type: 'date', label: 'Updated by', required: false, app: 'Managed' },
    ],
    relations: [
      { id: 'r5', name: 'company', type: 'relation', label: 'Company', relationType: 'belongs_to', relationObject: 'companies', required: false, app: 'Managed' as const },
      { id: 'r6', name: 'notes', type: 'relation', label: 'Notes', relationType: 'has_many', relationObject: 'notes', required: false, app: 'Managed' as const },
    ],
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'opportunities',
    name: 'Opportunities',
    singular: 'Opportunity',
    plural: 'Opportunities',
    apiNameSingular: 'opportunity',
    apiNamePlural: 'opportunities',
    description: 'Oportunidades de vendas',
    icon: 'Target',
    recordLabelField: 'title',
    fields: [
      { id: 'title', name: 'title', type: 'text', label: 'Name', required: true, app: 'Managed' },
      { id: 'value', name: 'value', type: 'currency', label: 'ARR', required: false, app: 'Managed' },
      { id: 'stage', name: 'stage', type: 'select', label: 'Stage', required: false, options: ['Prospect', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'], app: 'Managed' },
      { id: 'icp', name: 'icp', type: 'number', label: 'ICP', required: false, app: 'Managed' },
      { id: 'created_at', name: 'created_at', type: 'date', label: 'Created by', required: false, app: 'Managed' },
      { id: 'updated_at', name: 'updated_at', type: 'date', label: 'Updated by', required: false, app: 'Managed' },
      { id: 'deleted_at', name: 'deleted_at', type: 'date', label: 'Deleted at', required: false, app: 'Managed' },
    ],
    relations: [
      { id: 'r7', name: 'company', type: 'relation', label: 'Company', relationType: 'belongs_to', relationObject: 'companies', required: false, app: 'Managed' as const },
      { id: 'r8', name: 'contact', type: 'relation', label: 'Contact', relationType: 'belongs_to', relationObject: 'people', required: false, app: 'Managed' as const },
    ],
    createdAt: '2024-01-15T10:00:00Z',
  },
];

type ViewState = 'list' | 'object-detail' | 'add-field' | 'create-object';

export function DataModelView() {
  const [viewState, setViewState] = useState<ViewState>('list');
  const [objects, setObjects] = useState<DataObject[]>(MOCK_OBJECTS);
  const [selectedObject, setSelectedObject] = useState<DataObject | null>(null);

  const handleCreateObject = () => {
    setViewState('create-object');
  };

  const handleSaveObject = (newObjectData: {
    name: string;
    singular: string;
    plural: string;
    apiNameSingular: string;
    apiNamePlural: string;
    description?: string;
    icon: string;
  }) => {
    const newObject: DataObject = {
      id: `obj_${Date.now()}`,
      ...newObjectData,
      fields: [
        { id: 'name', name: 'name', type: 'text', label: 'Name', required: true, app: 'Managed' },
      ],
      relations: [],
      recordLabelField: 'name',
      createdAt: new Date().toISOString(),
    };

    setObjects([...objects, newObject]);
    setViewState('list');
  };

  const handleEditObject = (obj: DataObject) => {
    setSelectedObject(obj);
    setViewState('object-detail');
  };

  const handleDeleteObject = (id: string) => {
    setObjects((prev) => prev.filter((obj) => obj.id !== id));
  };

  const handleBackToList = () => {
    setViewState('list');
    setSelectedObject(null);
  };

  const handleObjectChange = (updatedObject: DataObject) => {
    setSelectedObject(updatedObject);
    setObjects((prev) =>
      prev.map((obj) => (obj.id === updatedObject.id ? updatedObject : obj))
    );
  };

  const handleNavigateToAddField = () => {
    setViewState('add-field');
  };

  const handleSaveField = (field: Omit<DataField, 'id' | 'app'>) => {
    if (!selectedObject) return;

    const newField: DataField = {
      ...field,
      id: `field_${Date.now()}`,
      app: 'Custom',
    };

    const updatedObject = {
      ...selectedObject,
      fields: [...selectedObject.fields, newField],
    };

    setSelectedObject(updatedObject);
    setObjects((prev) =>
      prev.map((obj) => (obj.id === updatedObject.id ? updatedObject : obj))
    );
    setViewState('object-detail');
  };

  // Render add field view
  if (viewState === 'add-field' && selectedObject) {
    return (
      <AddFieldView
        objectName={selectedObject.name}
        objectIcon={selectedObject.icon}
        onBack={() => setViewState('object-detail')}
        onSave={handleSaveField}
      />
    );
  }

  // Render create object view
  if (viewState === 'create-object') {
    return (
      <CreateObjectPage
        onCancel={() => setViewState('list')}
        onSave={handleSaveObject}
      />
    );
  }

  // Render object detail view
  if (viewState === 'object-detail' && selectedObject) {
    return (
      <ObjectDetailView
        object={selectedObject}
        onBack={handleBackToList}
        onNavigateToAddField={handleNavigateToAddField}
        onObjectChange={handleObjectChange}
      />
    );
  }

  // Render main list view
  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="px-10 py-8 pb-2 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <Database className="h-5 w-5 text-gray-500" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">Modelo de Dados</h1>
          </div>

          <Button
            onClick={handleCreateObject}
            className="flex items-center gap-2 bg-red-400 hover:bg-red-500 text-white"
          >
            <Plus className="h-4 w-4" />
            Criar Objeto
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-10 py-8">
        <div className="max-w-4xl mx-auto">
          {objects.length === 0 ? (
            <div className="text-center py-12">
              <Database className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Nenhum objeto criado ainda
              </h2>
              <p className="text-gray-500 mb-6">
                Crie seu primeiro modelo de dados personalizado para começar.
              </p>
              <Button
                onClick={handleCreateObject}
                className="bg-red-400 hover:bg-red-500 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Objeto
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-gray-500">
                {objects.length} objeto{objects.length !== 1 ? 's' : ''} encontrado{objects.length !== 1 ? 's' : ''}
              </div>

              {objects.map((obj) => (
                <div
                  key={obj.id}
                  onClick={() => handleEditObject(obj)}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                        <Database className="h-5 w-5 text-red-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{obj.name}</h3>
                        <p className="text-sm text-gray-500">{obj.description}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {obj.fields.length} campo{obj.fields.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditObject(obj);
                        }}
                        className="hover:bg-gray-100"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteObject(obj.id);
                        }}
                        className="hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
