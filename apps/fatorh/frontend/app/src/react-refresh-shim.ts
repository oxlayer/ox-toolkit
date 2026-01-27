// Shim for React Fast Refresh globals to avoid `$RefreshSig$ is not defined` errors
// This is only active in development and is safe to remove if the bundler
// correctly injects the React Refresh runtime.

declare global {
    interface Window {
        $RefreshReg$?: (type: unknown, id: string) => void
        $RefreshSig$?: () => (type: unknown) => unknown
    }
}

// Use NODE_ENV to detect development mode without relying on `import.meta.env`
const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development'

if (typeof window !== 'undefined' && isDev) {
    if (!window.$RefreshReg$) {
        window.$RefreshReg$ = () => {
            // no-op: registration is handled by the React Refresh runtime when present
        }
    }

    if (!window.$RefreshSig$) {
        window.$RefreshSig$ = () => (type: unknown) => type
    }
}

export { }


