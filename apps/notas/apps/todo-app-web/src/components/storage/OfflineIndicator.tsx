/**
 * Offline Indicator Component
 *
 * Shows the current storage mode and offline status.
 * - Anonymous: Shows "Local only" badge
 * - Authenticated: Shows offline count and sync status
 */

import { useState, useEffect } from 'react';
import { useStorage } from '@/lib/storage';
import { WifiOff, Cloud, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function OfflineIndicator() {
    const { mode, isReady } = useStorage();

    if (!isReady) {
        return (
            <Badge variant="outline" className="text-xs">
                Loading...
            </Badge>
        );
    }

    if (mode === 'anonymous') {
        return (
            <Badge variant="secondary" className="text-xs">
                <WifiOff className="h-3 w-3 mr-1" />
                Local only
            </Badge>
        );
    }

    return (
        <Badge variant="outline" className="text-xs">
            <Cloud className="h-3 w-3 mr-1" />
            Offline ready
        </Badge>
    );
}

/**
 * Detailed offline status for authenticated mode
 */
export function OfflineStatus() {
    const { mode, getOfflineModules } = useStorage();
    const [offlineCount, setOfflineCount] = useState<number>(0);

    useEffect(() => {
        if (mode === 'authenticated') {
            getOfflineModules().then(keys => setOfflineCount(keys.length));
        }
    }, [mode, getOfflineModules]);

    if (mode === 'anonymous') {
        return (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <WifiOff className="h-4 w-4" />
                <span>Local mode - data stored on device</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Check className="h-4 w-4 text-green-500" />
            <span>{offlineCount} modules available offline</span>
        </div>
    );
}
