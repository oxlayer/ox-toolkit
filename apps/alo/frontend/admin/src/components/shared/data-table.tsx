import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface DataTableProps {
  columns: Array<{ key: string; label: string; className?: string }>
  data: Array<Record<string, unknown>>
  emptyMessage?: string
  isLoading?: boolean
  rowKey: string
  renderCell?: (columnKey: string, row: Record<string, unknown>) => ReactNode
  className?: string
}

/**
 * Data table component for displaying tabular data
 */
export function DataTable({
  columns,
  data,
  emptyMessage = 'No data found',
  isLoading = false,
  rowKey,
  renderCell,
  className,
}: DataTableProps) {
  if (isLoading) {
    return (
      <div className={cn('rounded-xl border border-border bg-surface p-12 text-center', className)}>
        <div className="inline-block size-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className={cn('rounded-xl border border-border bg-surface p-12 text-center', className)}>
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className={cn('overflow-hidden rounded-xl border border-border bg-surface shadow-sm', className)}>
      <table className="w-full">
        <thead className="border-b border-border bg-muted/50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  'px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground',
                  column.className
                )}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.map((row) => (
            <tr key={String(row[rowKey])} className="transition-colors hover:bg-muted/50">
              {columns.map((column) => (
                <td key={column.key} className={cn('px-6 py-4 text-sm', column.className)}>
                  {renderCell ? renderCell(column.key, row) : String(row[column.key] ?? '-')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
