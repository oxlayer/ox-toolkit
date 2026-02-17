import { OrgSwitcher } from './OrgSwitcher';
import { EnvItem } from './EnvItem';
import { AccountPanel } from './AccountPanel';
import { Environment, Organization } from '../../types';

interface SidebarProps {
  currentOrg: Organization;
  currentEnv: Environment;
  onEnvChange: (env: Environment) => void;
}

export function Sidebar({ currentOrg, currentEnv, onEnvChange }: SidebarProps) {
  return (
    <aside className="w-64 bg-[#0f0f0f] border-r border-white/5 flex flex-col">
      {/* Organization Switcher */}
      <div className="p-4 border-b border-white/5">
        <OrgSwitcher currentOrg={currentOrg} />
      </div>

      {/* Environments Section */}
      <nav className="flex-1 p-4 space-y-6">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-white/30 mb-2 px-1">
            Environments
          </p>
          <div className="space-y-1">
            <EnvItem env="dev" active={currentEnv === 'dev'} onClick={() => onEnvChange('dev')} />
            <EnvItem env="stg" active={currentEnv === 'stg'} onClick={() => onEnvChange('stg')} />
            <EnvItem env="prd" active={currentEnv === 'prd'} onClick={() => onEnvChange('prd')} />
          </div>
        </div>
      </nav>

      {/* Account Section */}
      <div className="border-t border-white/5 p-3">
        <AccountPanel />
      </div>
    </aside>
  );
}
