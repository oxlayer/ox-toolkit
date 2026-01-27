import { createContext, useContext, type ReactNode } from 'react';

interface LayoutContextState {
    toggleSidebar: () => void;
    isMobile: boolean;
}

const LayoutContext = createContext<LayoutContextState | undefined>(undefined);

export const LayoutProvider = ({
    children,
    toggleSidebar,
    isMobile
}: {
    children: ReactNode;
    toggleSidebar: () => void;
    isMobile: boolean;
}) => {
    return (
        <LayoutContext.Provider value={{ toggleSidebar, isMobile }}>
            {children}
        </LayoutContext.Provider>
    );
};

export const useLayout = () => {
    const context = useContext(LayoutContext);
    if (context === undefined) {
        throw new Error('useLayout must be used within a LayoutProvider');
    }
    return context;
};

