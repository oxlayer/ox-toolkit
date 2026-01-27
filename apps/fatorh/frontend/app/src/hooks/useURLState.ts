import { useSearchParams } from "react-router";
import { useCallback, useRef, useEffect } from "react";
import { useDebouncedCallback } from 'use-debounce';

interface URLStateUpdates {
    filters?: Record<string, any>;
    pagination?: { page?: number; pageSize?: number };
    preserveOthers?: boolean;
}

export function useURLState(debounceDelay: number = 300) {
    const [searchParams, setSearchParams] = useSearchParams();
    const isInitialMount = useRef(true);
    
    // Track what parameters we manage
    const managedParams = useRef({
        filters: new Set<string>(),
        pagination: new Set(['page', 'pageSize'])
    });
    
    // Register filter keys on first use
    const registerFilterKeys = useCallback((keys: string[]) => {
        keys.forEach(key => managedParams.current.filters.add(key));
    }, []);
    
    // Debounced URL update for filters
    const debouncedFilterUpdate = useDebouncedCallback((params: URLSearchParams) => {
        setSearchParams(params, { replace: true });
    }, debounceDelay);
    
    // Immediate URL update for pagination
    const immediatePaginationUpdate = useCallback((params: URLSearchParams) => {
        setSearchParams(params, { replace: true });
    }, [setSearchParams]);
    
    // Main update function
    const updateURL = useCallback((updates: URLStateUpdates) => {
        const params = new URLSearchParams(searchParams);
        let hasFilterChanges = false;
        let hasPaginationChanges = false;
        
        // Handle filter updates
        if (updates.filters !== undefined) {
            hasFilterChanges = true;
            
            // Clear all managed filter params first
            managedParams.current.filters.forEach(key => {
                params.delete(key);
            });
            
            // Set new filter values
            Object.entries(updates.filters).forEach(([key, value]) => {
                managedParams.current.filters.add(key);
                
                if (value !== undefined && value !== null && value !== '' && 
                    (!Array.isArray(value) || value.length > 0)) {
                    if (Array.isArray(value)) {
                        params.set(key, value.join(','));
                    } else {
                        params.set(key, String(value));
                    }
                }
            });
        }
        
        // Handle pagination updates
        if (updates.pagination !== undefined) {
            hasPaginationChanges = true;
            
            if (updates.pagination.page !== undefined) {
                if (updates.pagination.page > 1) {
                    params.set('page', String(updates.pagination.page));
                } else {
                    params.delete('page');
                }
            }
            
            if (updates.pagination.pageSize !== undefined) {
                if (updates.pagination.pageSize !== 10) { // Default page size
                    params.set('pageSize', String(updates.pagination.pageSize));
                } else {
                    params.delete('pageSize');
                }
            }
        }
        
        // Update URL based on what changed
        if (hasPaginationChanges && !hasFilterChanges) {
            // Pagination only - immediate update
            immediatePaginationUpdate(params);
        } else if (hasFilterChanges) {
            // Has filter changes - debounced update
            debouncedFilterUpdate(params);
        }
    }, [searchParams, debouncedFilterUpdate, immediatePaginationUpdate]);
    
    // Get current values from URL
    const getURLValues = useCallback(() => {
        const filters: Record<string, any> = {};
        const pagination = {
            page: 1,
            pageSize: 10
        };
        
        searchParams.forEach((value, key) => {
            if (key === 'page') {
                pagination.page = parseInt(value, 10) || 1;
            } else if (key === 'pageSize') {
                pagination.pageSize = parseInt(value, 10) || 10;
            } else {
                // It's a filter param
                filters[key] = value;
            }
        });
        
        return { filters, pagination };
    }, [searchParams]);
    
    // Mark initial mount as complete
    useEffect(() => {
        isInitialMount.current = false;
    }, []);
    
    return {
        searchParams,
        updateURL,
        getURLValues,
        registerFilterKeys,
        isInitialMount: isInitialMount.current
    };
}