/**
 * Browser View Component
 * Renders web content using Electron's webview tag
 */

import { useRef, useEffect, useState } from 'react';
import { ExternalLink, RefreshCw, Lock, Home, ArrowLeft, ArrowRight } from 'lucide-react';

interface BrowserViewProps {
  url: string;
}

export function BrowserView({ url }: BrowserViewProps) {
  const webviewRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUrl, setCurrentUrl] = useState(`http://${url}`);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);

  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return;

    const handleLoad = () => {
      setLoading(false);
    };

    const didStartLoading = () => {
      setLoading(true);
    };

    const didStopLoading = () => {
      setLoading(false);
    };

    const didNavigate = (e: any) => {
      setCurrentUrl(e.url);
    };

    webview.addEventListener('did-finish-load', handleLoad);
    webview.addEventListener('did-start-loading', didStartLoading);
    webview.addEventListener('did-stop-loading', didStopLoading);
    webview.addEventListener('did-navigate', didNavigate);

    return () => {
      webview.removeEventListener('did-finish-load', handleLoad);
      webview.removeEventListener('did-start-loading', didStartLoading);
      webview.removeEventListener('did-stop-loading', didStopLoading);
      webview.removeEventListener('did-navigate', didNavigate);
    };
  }, []);

  const handleReload = () => {
    if (webviewRef.current) {
      webviewRef.current.reload();
    }
  };

  const handleOpenExternal = () => {
    window.open(currentUrl, '_blank');
  };

  const handleGoBack = () => {
    if (webviewRef.current && canGoBack) {
      webviewRef.current.goBack();
    }
  };

  const handleGoForward = () => {
    if (webviewRef.current && canGoForward) {
      webviewRef.current.goForward();
    }
  };

  const handleHome = () => {
    const homeUrl = `http://${url}`;
    setCurrentUrl(homeUrl);
    if (webviewRef.current) {
      webviewRef.current.src = homeUrl;
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a]">
      {/* Browser Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/20 border-b border-white/5">
        <div className="flex items-center space-x-2 flex-1">
          {/* Navigation Buttons */}
          <button
            onClick={handleGoBack}
            disabled={!canGoBack}
            className="p-1.5 hover:bg-white/10 rounded-lg transition disabled:opacity-30 disabled:hover:bg-transparent"
            title="Back"
          >
            <ArrowLeft className="w-4 h-4 text-white/60" />
          </button>

          <button
            onClick={handleGoForward}
            disabled={!canGoForward}
            className="p-1.5 hover:bg-white/10 rounded-lg transition disabled:opacity-30 disabled:hover:bg-transparent"
            title="Forward"
          >
            <ArrowRight className="w-4 h-4 text-white/60" />
          </button>

          <button
            onClick={handleHome}
            className="p-1.5 hover:bg-white/10 rounded-lg transition"
            title="Home"
          >
            <Home className="w-4 h-4 text-white/60" />
          </button>

          {/* Security Icon */}
          <Lock className="w-4 h-4 text-white/40" />

          {/* URL Bar */}
          <div className="flex-1 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
            <p className="text-xs text-white/60 font-mono truncate">{currentUrl}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleReload}
            className="p-1.5 hover:bg-white/10 rounded-lg transition"
            title="Reload"
          >
            <RefreshCw className={`w-4 h-4 text-white/50 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleOpenExternal}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition flex items-center space-x-1.5 text-xs text-white/60 border border-white/10"
            title="Open in external browser"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open External</span>
          </button>
        </div>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="h-0.5 bg-white/10 overflow-hidden">
          <div className="h-full bg-emerald-400 animate-pulse" style={{ width: '60%' }} />
        </div>
      )}

      {/* Webview */}
      <div className="flex-1 relative bg-white">
        <webview
          ref={webviewRef}
          src={currentUrl}
          style={{ width: '100%', height: '100%', border: 'none' }}
          partition="persist:service-webview"
          allowpopups="true"
        />
      </div>
    </div>
  );
}
