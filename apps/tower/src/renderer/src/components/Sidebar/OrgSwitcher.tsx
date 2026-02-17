import { ChevronDown } from 'lucide-react';
import { Organization } from '../../types';

interface OrgSwitcherProps {
  currentOrg: Organization;
}

export function OrgSwitcher({ currentOrg }: OrgSwitcherProps) {
  return (
    <button className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] transition flex items-center justify-between group">
      <div className="flex items-center space-x-2">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
          {currentOrg.name.charAt(0)}
        </div>
        <span className="text-sm font-medium text-white">
          {currentOrg.name}
        </span>
      </div>
      <ChevronDown className="w-4 h-4 text-white/40 group-hover:text-white/60 transition" />
    </button>
  );
}
