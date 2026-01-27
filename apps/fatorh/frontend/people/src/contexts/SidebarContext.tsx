import { createContext, useState, useContext, useMemo, useCallback, useEffect, type ReactNode } from 'react';

interface SidebarContextState {
    isPinned: boolean;
    togglePin: () => void;
}

const SidebarContext = createContext<SidebarContextState | undefined>(undefined);

export const SidebarProvider = ({ children }: { children: ReactNode }) => {
    const [isPinned, setIsPinned] = useState(() => {
        // Read pinned state from localStorage
        const saved = localStorage.getItem('sidebarPinned');
        return saved === 'true';
    });

    const togglePin = useCallback(() => {
        setIsPinned(prev => {
            const newValue = !prev;
            // Save to localStorage
            localStorage.setItem('sidebarPinned', newValue.toString());
            return newValue;
        });
    }, []);

    // Save isPinned state to localStorage when it changes
    useEffect(() => {
        localStorage.setItem('sidebarPinned', isPinned.toString());
    }, [isPinned]);

    // Memoize context value to prevent unnecessary re-renders
    const value = useMemo(() => ({
        isPinned,
        togglePin,
    }), [isPinned, togglePin]);

    return (
        <SidebarContext.Provider value={value}>
            {children}
        </SidebarContext.Provider>
    );
};

export const useSidebar = () => {
    const context = useContext(SidebarContext);
    if (context === undefined) {
        throw new Error('useSidebar must be used within a SidebarProvider');
    }
    return context;
};

