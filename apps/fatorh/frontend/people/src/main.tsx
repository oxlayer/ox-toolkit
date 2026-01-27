import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Ensure React Fast Refresh globals exist in dev to prevent `$RefreshSig$` errors
import './react-refresh-shim'

import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
