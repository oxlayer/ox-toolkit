import { useState } from 'react';
import { Play, Square, ExternalLink, Terminal, X } from 'lucide-react';
import { tabsService } from '../../services';
import { PortSelectorModal, PortOption } from '../Modal';

interface Service {
  name: string;
  status: 'running' | 'stopped' | 'unknown';
  port: string;
  url: string;
  hasLogs: boolean;
  ports?: PortOption[]; // Multiple ports if available
}

interface ServicesTableProps {
  servicesStatus?: Record<string, string>; // Real-time status from polling
}

interface ServiceRowProps {
  service: Service;
  onToggleService: (serviceName: string) => void;
  onViewLogs: (serviceName: string) => void;
}

function ServiceRow({ service, onToggleService, onViewLogs }: ServiceRowProps) {
  const [showPortSelector, setShowPortSelector] = useState(false);
  const [openExternal, setOpenExternal] = useState(false);

  const handleUrlClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    // If service has multiple ports, show selector
    if (service.ports && service.ports.length > 1) {
      e.preventDefault();
      // Set flag based on Ctrl/Cmd key press
      setOpenExternal(e.ctrlKey || e.metaKey);
      setShowPortSelector(true);
      return;
    }

    if (e.ctrlKey || e.metaKey) {
      // Ctrl+Click or Cmd+Click: Open in external browser
      // Let default behavior happen
      return;
    } else {
      // Regular click: Open in tab
      e.preventDefault();
      await tabsService.openServiceTab(service.name, service.url);
    }
  };

  const handlePortSelect = async (portOption: PortOption) => {
    if (openExternal) {
      // Open in external browser
      window.open(`http://${portOption.url}`, '_blank');
    } else {
      // Open in tab
      await tabsService.openServiceTab(`${service.name} (${portOption.port})`, portOption.url);
    }
  };

  const handlePortSelectExternal = (portOption: PortOption, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`http://${portOption.url}`, '_blank');
    setShowPortSelector(false);
  };

  return (
    <>
      <tr className="hover:bg-white/[0.02] transition group">
        <td className="px-4 py-3">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              service.status === 'running' ? 'bg-emerald-400' :
              service.status === 'stopped' ? 'bg-red-400' :
              'bg-amber-400'
            }`} />
            <span className="text-sm text-white/90">{service.name}</span>
            {service.ports && service.ports.length > 1 && (
              <span className="px-2 py-0.5 text-xs bg-white/5 text-white/50 rounded-full border border-white/10">
                {service.ports.length} ports
              </span>
            )}
          </div>
        </td>
        <td className="px-4 py-3">
          <span className={`text-xs ${
            service.status === 'running' ? 'text-emerald-400' :
            service.status === 'stopped' ? 'text-red-400' :
            'text-amber-400'
          }`}>
            {service.status === 'running' ? 'Running' : service.status === 'stopped' ? 'Stopped' : 'Unknown'}
          </span>
        </td>
        <td className="px-4 py-3">
          <span className="text-xs text-white/40 font-mono">
            {service.ports && service.ports.length > 1
              ? `${service.ports.length} ports`
              : service.port
            }
          </span>
        </td>
        <td className="px-4 py-3 text-right">
          <div className="flex items-center justify-end space-x-2">
            {/* Logs Button */}
            <button
              onClick={() => onViewLogs(service.name)}
              className="p-1.5 hover:bg-white/10 rounded-lg transition text-white/40 hover:text-white/80"
              title="View Logs"
            >
              <Terminal className="w-4 h-4" />
            </button>

            {/* Open in Browser/Tab */}
            <a
              href={`http://${service.url}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleUrlClick}
              className="p-1.5 hover:bg-white/10 rounded-lg transition text-white/40 hover:text-white/80"
              title={
                service.ports && service.ports.length > 1
                  ? `Click to select port (multiple available)`
                  : `Click to open in tab, Ctrl+Click to open in external browser - http://${service.url}`
              }
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* Restart/Stop Button */}
            <button
              onClick={() => onToggleService(service.name)}
              className={`p-1.5 hover:bg-white/10 rounded-lg transition ${
                service.status === 'running'
                  ? 'text-white/40 hover:text-red-400 hover:bg-red-500/10'
                  : 'text-white/40 hover:text-emerald-400 hover:bg-emerald-500/10'
              }`}
              title={service.status === 'running' ? 'Stop Service' : 'Start Service'}
            >
              {service.status === 'running' ? (
                <Square className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </button>

            <span className="text-xs text-white/30 font-mono">{service.url}</span>
          </div>
        </td>
      </tr>

      {/* Port Selector Modal */}
      {showPortSelector && service.ports && (
        <PortSelectorModal
          serviceName={service.name}
          ports={service.ports}
          onSelect={handlePortSelect}
          onClose={() => setShowPortSelector(false)}
          openExternal={openExternal}
        />
      )}
    </>
  );
}

export function ServicesTable({ servicesStatus }: ServicesTableProps) {
  const [selectedLogs, setSelectedLogs] = useState<{ service: string; logs: string[] } | null>(null);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Define services with their default configurations
  const baseServices: Omit<Service, 'status'>[] = [
    {
      name: 'Postgres',
      port: '5432',
      url: 'postgres.localhost',
      hasLogs: true,
    },
    {
      name: 'Redis',
      port: '6379',
      url: 'redis.localhost',
      hasLogs: true,
    },
    {
      name: 'RabbitMQ',
      port: '5672',
      url: 'rabbitmq.localhost',
      hasLogs: true,
      ports: [
        { port: '5672', url: 'rabbitmq.localhost', description: 'AMQP Protocol', primary: true },
        { port: '15672', url: 'rabbitmq.localhost:15672', description: 'Management UI' },
      ],
    },
    {
      name: 'Keycloak',
      port: '8080',
      url: 'keycloak.localhost',
      hasLogs: true,
    },
    {
      name: 'Prometheus',
      port: '9090',
      url: 'prometheus.localhost',
      hasLogs: true,
    },
    {
      name: 'Grafana',
      port: '3000',
      url: 'grafana.localhost',
      hasLogs: true,
    },
    {
      name: 'Traefik',
      port: '80',
      url: 'traefik.localhost',
      hasLogs: true,
      ports: [
        { port: '80', url: 'traefik.localhost', description: 'HTTP', primary: true },
        { port: '443', url: 'traefik.localhost', description: 'HTTPS' },
        { port: '9090', url: 'traefik.localhost:9090', description: 'Dashboard' },
      ],
    },
  ];

  // Merge real-time status from polling with base service configuration
  const services: Service[] = baseServices.map(service => ({
    ...service,
    status: (servicesStatus?.[service.name] as Service['status']) || 'unknown',
  }));

  const handleToggleService = (serviceName: string) => {
    console.log('Toggle service:', serviceName);
    // TODO: Implement actual service start/stop via SDK
  };

  const handleViewLogs = async (serviceName: string) => {
    setLoadingLogs(true);
    try {
      console.log('Fetching logs for:', serviceName);
      const result = await window.oxlayer.getServiceLogs(serviceName);
      console.log('Logs result:', result);

      if (result.success && result.logs) {
        setSelectedLogs({ service: serviceName, logs: result.logs });
      } else {
        // Show error message in logs
        setSelectedLogs({
          service: serviceName,
          logs: [`Failed to load logs: ${result.error || 'Unknown error'}`]
        });
      }
    } catch (error: any) {
      console.error('Error loading logs:', error);
      setSelectedLogs({
        service: serviceName,
        logs: [`Failed to load logs: ${error.message}`]
      });
    } finally {
      setLoadingLogs(false);
    }
  };

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-white/5">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Service</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Port</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wider">Actions & URL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {services.map((service) => (
              <ServiceRow
                key={service.name}
                service={service}
                onToggleService={handleToggleService}
                onViewLogs={handleViewLogs}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Logs Modal */}
      {selectedLogs && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <div className="flex items-center space-x-3">
                <Terminal className="w-5 h-5 text-white/60" />
                <div>
                  <h3 className="text-lg font-semibold text-white">{selectedLogs.service} Logs</h3>
                  <p className="text-xs text-white/40">Real-time service logs</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLogs(null)}
                className="p-2 hover:bg-white/10 rounded-lg transition"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            {/* Logs Content */}
            <div className="flex-1 overflow-auto bg-black/40 p-4">
              {loadingLogs ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-white/40 text-sm">Loading logs...</div>
                </div>
              ) : (
                <div className="font-mono text-xs space-y-1">
                  {selectedLogs.logs.map((log, index) => (
                    <div key={index} className="text-white/70 hover:bg-white/5 px-2 py-1 rounded">
                      <span className="text-white/40 mr-2">{log.split(']')[0]}]</span>
                      <span className={log.toLowerCase().includes('error') ? 'text-red-400' :
                                  log.toLowerCase().includes('warn') ? 'text-amber-400' :
                                  log.toLowerCase().includes('starting') || log.toLowerCase().includes('ready') ? 'text-emerald-400' :
                                  'text-white/70'}>
                        {log.split(']').slice(1).join(']')}
                      </span>
                    </div>
                  ))}
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="text-emerald-400 text-xs flex items-center space-x-2">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                      <span>Live logs connected</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-white/5 bg-black/20 flex items-center justify-between">
              <div className="text-xs text-white/40">
                Showing {selectedLogs.logs.length} log entries
              </div>
              <div className="flex items-center space-x-2">
                <button className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 rounded-lg text-white/60 transition">
                  Clear Logs
                </button>
                <button className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 rounded-lg text-white/60 transition">
                  Download Logs
                </button>
                <button
                  onClick={() => setSelectedLogs(null)}
                  className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 rounded-lg text-white/60 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
