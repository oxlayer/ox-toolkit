/**
 * Data Portability Components
 *
 * Provides export/import functionality for user data.
 * Available in both anonymous and authenticated modes.
 */

import { useState, useRef } from 'react';
import { Download, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDataPortability } from '@/lib/storage';

// ============================================================================
// EXPORT BUTTON
// ============================================================================

interface ExportButtonProps {
    variant?: 'default' | 'ghost' | 'outline';
    size?: 'default' | 'sm' | 'icon';
    className?: string;
}

export function ExportButton({ variant = 'outline', size = 'sm', className }: ExportButtonProps) {
    const { export: exportData } = useDataPortability();
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            await exportData();
        } catch (error) {
            console.error('[ExportButton] Export failed:', error);
            alert('Failed to export data. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Button
            variant={variant}
            size={size}
            className={className}
            onClick={handleExport}
            disabled={isExporting}
        >
            {isExporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
                <Download className="h-4 w-4 mr-2" />
            )}
            Export Data
        </Button>
    );
}

// ============================================================================
// IMPORT BUTTON
// ============================================================================

interface ImportButtonProps {
    variant?: 'default' | 'ghost' | 'outline';
    size?: 'default' | 'sm' | 'icon';
    className?: string;
    onImportComplete?: () => void;
}

export function ImportButton({
    variant = 'outline',
    size = 'sm',
    className,
    onImportComplete
}: ImportButtonProps) {
    const { import: importData } = useDataPortability();
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImport = async (file: File) => {
        setIsImporting(true);
        try {
            await importData(file);
            onImportComplete?.();
            // Reload to show imported data
            window.location.reload();
        } catch (error) {
            console.error('[ImportButton] Import failed:', error);
            alert('Failed to import data. Please check the file format.');
        } finally {
            setIsImporting(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleImport(file);
        }
    };

    return (
        <>
            <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileChange}
            />
            <Button
                variant={variant}
                size={size}
                className={className}
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
            >
                {isImporting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                    <Upload className="h-4 w-4 mr-2" />
                )}
                Import Data
            </Button>
        </>
    );
}

// ============================================================================
// DATA PORTABILITY MENU (Combined)
// ============================================================================

interface DataPortabilityMenuProps {
    variant?: 'default' | 'ghost' | 'outline';
    size?: 'default' | 'sm';
    className?: string;
}

export function DataPortabilityMenu({
    variant = 'ghost',
    size = 'sm',
    className
}: DataPortabilityMenuProps) {
    return (
        <div className="flex items-center gap-2">
            <ExportButton variant={variant} size={size} className={className} />
            <ImportButton variant={variant} size={size} className={className} />
        </div>
    );
}
