import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Building2, ChevronDown } from 'lucide-react';

/**
 * WorkspaceSwitcher component
 * Displays a dropdown to switch between workspaces
 */
export function WorkspaceSwitcher() {
  const { currentWorkspace, workspaces, setCurrentWorkspace } = useWorkspace();

  if (!currentWorkspace) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500">
        <Building2 className="h-4 w-4" />
        <span>No workspace selected</span>
      </div>
    );
  }

  return (
    <Select
      value={currentWorkspace.id}
      onValueChange={setCurrentWorkspace}
    >
      <SelectTrigger className="w-[200px] bg-white border-gray-200">
        <Building2 className="h-4 w-4 text-gray-500" />
        <SelectValue placeholder="Select workspace" />
        <ChevronDown className="h-4 w-4 opacity-50" />
      </SelectTrigger>
      <SelectContent>
        {workspaces.map((workspace) => (
          <SelectItem key={workspace.id} value={workspace.id}>
            <div className="flex flex-col">
              <span className="font-medium">{workspace.name}</span>
              {workspace.description && (
                <span className="text-xs text-gray-500">{workspace.description}</span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
