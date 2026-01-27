import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout';
import { InboxView, TodayView, UpcomingView, ProjectView, SettingsView, NotificationsView, DataModelView } from '@/views';
import { AuthProvider, AuthRequiredProvider } from '@/lib/auth';
import { WorkspaceProvider, useWorkspace } from '@/lib/workspace';
import { SyncOnLoginProvider } from '@/hooks/use-sync-on-login.tsx';
import { useIntentSyncInit } from '@/hooks/use-intent-sync-init';
import { useServerSyncOnMount } from '@/hooks/use-server-sync-on-mount';
import { WorkspaceOnboardingModal } from '@/components/workspace/WorkspaceOnboardingModal';
import { FailedSyncBanner } from '@/components/ui/FailedSyncBanner';
import { StorageProvider } from '@/lib/storage';
import { sqliteStorage } from '@oxlayer/capabilities-web-state';
import { ApiProvider } from '@/lib/api/client';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
    },
  },
});

/**
 * Initialize SQLite WASM on app startup
 */
async function initializeApp() {
  try {
    await sqliteStorage.init();
    console.log('[App] SQLite WASM storage initialized');
  } catch (error) {
    console.error('[App] Failed to initialize SQLite WASM:', error);
  }
}

function AppContent() {
  const renderView = (view: string, project: { id: string; sectionId?: string } | null) => {
    if (project) {
      return <ProjectView projectId={project.id} sectionId={project.sectionId} onBack={() => {}} />;
    }

    switch (view) {
      case 'inbox':
        return <InboxView />;
      case 'today':
        return <TodayView />;
      case 'upcoming':
        return <UpcomingView />;
      case 'settings':
        return <SettingsView />;
      case 'notifications':
        return <NotificationsView />;
      case 'datamodel':
        return <DataModelView />;
      default:
        return <InboxView />;
    }
  };

  return <MainLayout renderContent={renderView} />;
}

/**
 * Inner app component that initializes the intent sync system
 * This must be inside WorkspaceProvider to use useWorkspace
 */
function AppInner() {
  // Initialize intent-first sync system (uses useWorkspace and useAuth)
  useIntentSyncInit();

  // Sync server data to localStorage on mount (API is source of truth when authenticated)
  useServerSyncOnMount();

  // Get onboarding state
  const { showOnboarding, dismissOnboarding, createWorkspace, workspaces } = useWorkspace();

  // Debug logging
  console.log('[AppInner] Rendering', { showOnboarding, workspacesCount: workspaces?.length });

  // Handle dismiss - create a default workspace if user cancels
  const handleDismissOnboarding = async () => {
    try {
      // Create a default personal workspace
      await createWorkspace({ name: 'My Tasks', type: 'personal' });
    } catch (error) {
      console.error('Failed to create default workspace:', error);
    }
    dismissOnboarding();
  };

  return (
    <>
      <FailedSyncBanner />
      <AppContent />
      {showOnboarding && (
        <WorkspaceOnboardingModal
          onClose={dismissOnboarding}
          onDismiss={handleDismissOnboarding}
        />
      )}
    </>
  );
}

function App() {
  // Initialize SQLite WASM on mount
  useEffect(() => {
    initializeApp();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ApiProvider>
          <AuthRequiredProvider>
            <WorkspaceProvider>
              <StorageProvider>
                <SyncOnLoginProvider>
                  <AppInner />
                </SyncOnLoginProvider>
              </StorageProvider>
            </WorkspaceProvider>
          </AuthRequiredProvider>
        </ApiProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
