/**
 * Port Selector Modal
 * Appears when clicking on a service with multiple exposed ports
 */

import { ExternalLink, X } from 'lucide-react';

export interface PortOption {
  port: string;
  url: string;
  description?: string;
  primary?: boolean; // Mark the most commonly used port
}

interface PortSelectorModalProps {
  serviceName: string;
  ports: PortOption[];
  onSelect: (port: PortOption) => void;
  onClose: () => void;
  openExternal?: boolean; // If true, default to external browser
}

export function PortSelectorModal({ serviceName, ports, onSelect, onClose, openExternal = false }: PortSelectorModalProps) {
  const handlePortClick = (port: PortOption) => {
    onSelect(port);
    onClose();
  };

  const handleOpenExternal = (port: PortOption, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`http://${port.url}`, '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <ExternalLink className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{serviceName}</h3>
              <p className="text-xs text-white/40">
                {openExternal ? 'Select a port to open in external browser' : 'Select a port to open'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Port Options */}
        <div className="p-4 space-y-2">
          {ports.map((portOption) => (
            <div
              key={portOption.port}
              onClick={() => handlePortClick(portOption)}
              className={`group relative p-4 rounded-xl border transition cursor-pointer ${
                portOption.primary
                  ? 'bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10 hover:border-emerald-500/30'
                  : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`text-sm font-medium ${
                      portOption.primary ? 'text-emerald-400' : 'text-white/90'
                    }`}>
                      Port {portOption.port}
                    </span>
                    {portOption.primary && (
                      <span className="px-2 py-0.5 text-xs bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                        Primary
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/50 mb-2 font-mono">{portOption.url}</p>
                  {portOption.description && (
                    <p className="text-xs text-white/60">{portOption.description}</p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {/* Open in Tab Button */}
                  {!openExternal && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePortClick(portOption);
                      }}
                      className={`p-2 rounded-lg transition ${
                        portOption.primary
                          ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                          : 'bg-white/5 text-white/60 hover:bg-white/10'
                      }`}
                      title="Open in tab"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  )}

                  {/* Open External Button */}
                  <button
                    onClick={(e) => handleOpenExternal(portOption, e)}
                    className="p-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 transition"
                    title="Open in external browser"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Hint */}
              <div className="mt-3 pt-3 border-t border-white/5 text-xs text-white/40">
                {openExternal
                  ? 'Click to open in external browser'
                  : 'Click to open in tab, or use the external link button'
                }
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/5 bg-black/20 flex items-center justify-between">
          <p className="text-xs text-white/40">
            {ports.length} port{ports.length > 1 ? 's' : ''} available
          </p>
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 rounded-lg text-white/60 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
