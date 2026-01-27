import { useState, useEffect, useCallback } from "react";
import { useURLState } from './useURLState';

export interface BaseFilters {
    search?: string;
}

export function useFilters<T extends BaseFilters>(
    defaultFilters: T,
    debounceDelay: number = 300
): {
    filters: T;
    setFilter: <K extends keyof T>(key: K, value: T[K]) => void;
    setFilters: (filters: Partial<T>) => void;
    clearFilters: () => void;
    clearFilter: <K extends keyof T>(key: K) => void;
    activeFilterCount: number;
} {
    const { updateURL, getURLValues, registerFilterKeys, isInitialMount } = useURLState(debounceDelay);
    
    // Register filter keys on mount
    useEffect(() => {
        registerFilterKeys(Object.keys(defaultFilters));
    }, []);
    
    const [filters, setFiltersState] = useState<T>(() => {
        // Initialize filters from URL params
        const { filters: urlFilters } = getURLValues();
        const initialFilters = { ...defaultFilters };
        
        Object.entries(urlFilters).forEach(([key, value]) => {
            if (key in defaultFilters) {
                const filterKey = key as keyof T;
                const defaultValue = defaultFilters[filterKey];
                
                // Parse value based on the default value type
                if (Array.isArray(defaultValue)) {
                    (initialFilters as any)[filterKey] = value.split(',').filter(Boolean);
                } else if (typeof defaultValue === 'number') {
                    (initialFilters as any)[filterKey] = parseFloat(value);
                } else if (typeof defaultValue === 'boolean') {
                    (initialFilters as any)[filterKey] = value === 'true';
                } else {
                    (initialFilters as any)[filterKey] = value;
                }
            }
        });
        return initialFilters;
    });

    // Sync filters to URL
    useEffect(() => {
        // Skip sync on initial mount if filters haven't changed from URL
        if (isInitialMount) return;
        
        updateURL({ filters: filters as any });
    }, [filters, updateURL, isInitialMount]);

    const setFilter = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
        setFiltersState(prev => ({
            ...prev,
            [key]: value
        }));
    }, []);

    const setFilters = useCallback((newFilters: Partial<T>) => {
        setFiltersState(prev => ({
            ...prev,
            ...newFilters
        }));
    }, []);

    const clearFilter = useCallback(<K extends keyof T>(key: K) => {
        setFiltersState(prev => ({
            ...prev,
            [key]: defaultFilters[key]
        }));
    }, [defaultFilters]);

    const clearFilters = useCallback(() => {
        setFiltersState(defaultFilters);
    }, [defaultFilters]);

    // Calculate active filter count
    const activeFilterCount = Object.entries(filters).reduce((count, [key, value]) => {
        const defaultValue = defaultFilters[key as keyof T];
        const isActive = value !== defaultValue && 
            value !== undefined && 
            value !== null && 
            value !== '' &&
            (!Array.isArray(value) || value.length > 0);
        return count + (isActive ? 1 : 0);
    }, 0);

    return {
        filters,
        setFilter,
        setFilters,
        clearFilters,
        clearFilter,
        activeFilterCount
    };
}