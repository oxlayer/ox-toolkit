import { X, AlertTriangle, Database, Server, Trash2 } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  type: 'realm' | 'database' | 'tenant' | null;
  tenantName: string;
  tenantDisplayName?: string;
  confirmedName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isExecuting: boolean;
  onInputChange: (value: string) => void;
  databaseInfo?: {
    count: number;
    databases: Array<{ workspaceName: string; database: string }>;
  };
}

export default function ConfirmationDialog({
  isOpen,
  type,
  tenantName,
  tenantDisplayName,
  confirmedName,
  onConfirm,
  onCancel,
  isExecuting,
  onInputChange,
  databaseInfo,
}: ConfirmationDialogProps) {
  if (!isOpen || !type) return null;

  const getTitle = () => {
    switch (type) {
      case 'tenant':
        return 'Delete Entire Tenant';
      case 'realm':
        return 'Delete Realm';
      case 'database':
        return 'Delete Database(s)';
    }
  };

  const getDescription = () => {
    switch (type) {
      case 'tenant':
        return (
          <>
            <p className="text-red-600 font-semibold mb-2">Warning: This will permanently delete:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Keycloak realm and all its users</li>
              <li>All organizations in Keycloak</li>
              <li>All PostgreSQL databases ({databaseInfo?.count || 0} databases)</li>
              <li>All registry entries from the control panel database</li>
            </ul>
            <p className="mt-3 text-sm text-gray-600">This action cannot be undone.</p>
          </>
        );
      case 'realm':
        return (
          <>
            <p>This will delete the Keycloak realm but keep the databases intact.</p>
            <p className="mt-2 text-sm text-gray-600">You can recreate the realm later if needed.</p>
          </>
        );
      case 'database':
        return (
          <>
            <p className="text-red-600 font-semibold mb-2">Warning: This will permanently delete:</p>
            {databaseInfo && databaseInfo.databases.length > 0 ? (
              <ul className="list-disc list-inside space-y-1 text-sm">
                {databaseInfo.databases.map((db, i) => (
                  <li key={i}>
                    <strong>{db.workspaceName}</strong>: {db.database}
                  </li>
                ))}
              </ul>
            ) : (
              <p>All databases for this tenant</p>
            )}
            <p className="mt-3 text-sm text-gray-600">This action cannot be undone.</p>
          </>
        );
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'tenant':
        return <Trash2 className="w-12 h-12 text-red-600" />;
      case 'realm':
        return <Server className="w-12 h-12 text-orange-600" />;
      case 'database':
        return <Database className="w-12 h-12 text-red-600" />;
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-lg">{getIcon()}</div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{getTitle()}</h3>
                <p className="text-sm text-gray-500">{tenantDisplayName || tenantName}</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              disabled={isExecuting}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-800">
              {getDescription()}
            </div>
          </div>

          {/* Type to confirm */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              To confirm, type the tenant name:
            </label>
            <code className="block px-3 py-2 bg-gray-100 border rounded-lg text-lg font-mono">
              {tenantName}
            </code>
            <input
              type="text"
              value={confirmedName}
              onChange={(e) => {
                onInputChange(e.target.value);
              }}
              disabled={isExecuting}
              placeholder="Type tenant name to confirm"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              autoFocus
            />
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isExecuting}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={confirmedName !== tenantName || isExecuting}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isExecuting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Confirm Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
