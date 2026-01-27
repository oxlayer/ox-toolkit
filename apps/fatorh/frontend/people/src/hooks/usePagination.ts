import { useState, useEffect, useCallback } from "react";
import type { PaginationState } from "@tanstack/react-table";
import { useURLState } from './useURLState';

interface UsePaginationOptions {
    defaultPageSize?: number;
}

export function usePagination(options?: UsePaginationOptions): {
    pagination: PaginationState;
    setPagination: React.Dispatch<React.SetStateAction<PaginationState>>;
    setPageIndex: (pageIndex: number) => void;
    setPageSize: (pageSize: number) => void;
} {
    const defaultPageSize = options?.defaultPageSize || 10;
    const { updateURL, getURLValues, isInitialMount } = useURLState();

    // Initialize pagination from URL params
    const [pagination, setPaginationState] = useState<PaginationState>(() => {
        const { pagination: urlPagination } = getURLValues();
        
        return {
            pageIndex: urlPagination.page > 0 ? urlPagination.page - 1 : 0,
            pageSize: urlPagination.pageSize || defaultPageSize
        };
    });

    // Sync pagination to URL whenever it changes
    useEffect(() => {
        // Skip sync on initial mount
        if (isInitialMount) return;
        
        updateURL({
            pagination: {
                page: pagination.pageIndex + 1,
                pageSize: pagination.pageSize
            }
        });
    }, [pagination, updateURL, isInitialMount]);

    // Wrapper for setPagination that works with React Table
    const setPagination = useCallback((updater: React.SetStateAction<PaginationState>) => {
        setPaginationState(updater);
    }, []);

    // Convenience methods
    const setPageIndex = useCallback((pageIndex: number) => {
        setPaginationState(prev => ({ ...prev, pageIndex }));
    }, []);

    const setPageSize = useCallback((pageSize: number) => {
        setPaginationState(prev => ({ ...prev, pageSize, pageIndex: 0 }));
    }, []);

    return {
        pagination,
        setPagination,
        setPageIndex,
        setPageSize
    };
}