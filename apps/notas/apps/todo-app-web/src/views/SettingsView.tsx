/**
 * Settings View
 *
 * User settings and data management.
 * Different features shown based on authentication mode.
 */

import { useAuth } from '@/lib/auth';
import { useWorkspace } from '@/lib/workspace';
import { useStorage } from '@/lib/storage';
import { OfflineIndicator, OfflineStatus } from '@/components/storage';
import { DataPortabilityMenu } from '@/components/storage';
import { WifiOff, Cloud, Lock, Database, Shield, Info } from 'lucide-react';

export function SettingsView() {
    const { isAuthenticated } = useAuth();
    const { currentWorkspace } = useWorkspace();
    const { mode } = useStorage();

    return (
        <div className="max-w-4xl mx-auto p-8">
            <div className="mb-8">
                <h2 className="text-2xl font-bold mb-2">Settings</h2>
                <p className="text-muted-foreground">
                    Manage your data and application preferences
                </p>
            </div>

            {/* Storage Mode Status */}
            <div className="mb-8 p-6 bg-white rounded-lg border">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Storage Mode
                </h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                            {mode === 'anonymous' ? (
                                <WifiOff className="h-8 w-8 text-orange-500" />
                            ) : (
                                <Cloud className="h-8 w-8 text-blue-500" />
                            )}
                            <div>
                                <div className="font-medium">
                                    {mode === 'anonymous' ? 'Local Only Mode' : 'Offline-First Mode'}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {mode === 'anonymous'
                                        ? 'Your data is stored locally on this device. Export to backup.'
                                        : 'Your data syncs to the cloud when online. Recent data available offline.'}
                                </div>
                            </div>
                        </div>
                        <OfflineIndicator />
                    </div>

                    <OfflineStatus />
                </div>
            </div>

            {/* Data Portability */}
            <div className="mb-8 p-6 bg-white rounded-lg border">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Data Portability
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Export your data at any time. Import data from previous exports.
                </p>
                <div className="flex items-center gap-4">
                    <DataPortabilityMenu />
                </div>

                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div className="text-sm text-blue-900">
                            <p className="font-medium mb-1">About Export/Import</p>
                            <p className="text-blue-700">
                                {mode === 'anonymous'
                                    ? 'Since you are in local-only mode, exporting is the only way to backup your data. Keep your export files safe!'
                                    : 'Export creates a complete backup of your offline data. Use it to transfer data to another device or restore after clearing local storage.'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Feature Availability by Mode */}
            <div className="mb-8 p-6 bg-white rounded-lg border">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Feature Availability
                </h3>
                <div className="space-y-4">
                    {mode === 'anonymous' ? (
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-green-600">
                                <div className="h-2 w-2 rounded-full bg-green-500" />
                                <span className="font-medium">Basic Todos</span>
                                <span className="text-sm text-muted-foreground ml-auto">✓ Available</span>
                            </div>
                            <div className="flex items-center gap-3 text-green-600">
                                <div className="h-2 w-2 rounded-full bg-green-500" />
                                <span className="font-medium">Markdown Notes</span>
                                <span className="text-sm text-muted-foreground ml-auto">✓ Available</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-400">
                                <div className="h-2 w-2 rounded-full bg-gray-300" />
                                <span className="font-medium">Teams & Collaboration</span>
                                <span className="text-sm text-muted-foreground ml-auto">✗ Login required</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-400">
                                <div className="h-2 w-2 rounded-full bg-gray-300" />
                                <span className="font-medium">Calendar Integration</span>
                                <span className="text-sm text-muted-foreground ml-auto">✗ Login required</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-400">
                                <div className="h-2 w-2 rounded-full bg-gray-300" />
                                <span className="font-medium">Audio Transcription</span>
                                <span className="text-sm text-muted-foreground ml-auto">✗ Login required</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-400">
                                <div className="h-2 w-2 rounded-full bg-gray-300" />
                                <span className="font-medium">Cloud Sync</span>
                                <span className="text-sm text-muted-foreground ml-auto">✗ Login required</span>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-green-600">
                                <div className="h-2 w-2 rounded-full bg-green-500" />
                                <span className="font-medium">Basic Todos</span>
                                <span className="text-sm text-muted-foreground ml-auto">✓ Available</span>
                            </div>
                            <div className="flex items-center gap-3 text-green-600">
                                <div className="h-2 w-2 rounded-full bg-green-500" />
                                <span className="font-medium">Markdown Notes</span>
                                <span className="text-sm text-muted-foreground ml-auto">✓ Available</span>
                            </div>
                            <div className="flex items-center gap-3 text-green-600">
                                <div className="h-2 w-2 rounded-full bg-green-500" />
                                <span className="font-medium">Teams & Collaboration</span>
                                <span className="text-sm text-muted-foreground ml-auto">✓ Available</span>
                            </div>
                            <div className="flex items-center gap-3 text-green-600">
                                <div className="h-2 w-2 rounded-full bg-green-500" />
                                <span className="font-medium">Calendar Integration</span>
                                <span className="text-sm text-muted-foreground ml-auto">✓ Available</span>
                            </div>
                            <div className="flex items-center gap-3 text-green-600">
                                <div className="h-2 w-2 rounded-full bg-green-500" />
                                <span className="font-medium">Audio Transcription</span>
                                <span className="text-sm text-muted-foreground ml-auto">✓ Available</span>
                            </div>
                            <div className="flex items-center gap-3 text-green-600">
                                <div className="h-2 w-2 rounded-full bg-green-500" />
                                <span className="font-medium">Cloud Sync</span>
                                <span className="text-sm text-muted-foreground ml-auto">✓ Available</span>
                            </div>
                        </div>
                    )}
                </div>

                {!isAuthenticated && (
                    <div className="mt-6 p-4 bg-orange-50 rounded-lg">
                        <p className="text-sm text-orange-900">
                            <strong>Want more features?</strong> Log in to access teams, calendar, audio transcription, and cloud sync.
                        </p>
                    </div>
                )}
            </div>

            {/* Workspace Info */}
            {currentWorkspace && (
                <div className="p-6 bg-white rounded-lg border">
                    <h3 className="text-lg font-semibold mb-4">Current Workspace</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Name:</span>
                            <span className="font-medium">{currentWorkspace.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">ID:</span>
                            <span className="font-mono text-xs">{currentWorkspace.id}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Type:</span>
                            <span className="font-medium capitalize">{currentWorkspace.type}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
