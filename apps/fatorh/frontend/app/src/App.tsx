import './index.css'

import { BrowserRouter, Routes, Route } from "react-router"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { SidebarProvider } from "./contexts/SidebarContext"
import { AuthProvider } from "./contexts/AuthContext"
import Layout from "./components/Layout"
import ProtectedRoute from './components/ProtectedRoute'
import { Settings } from 'lucide-react'
import MyScreenings from './pages/MyScreenings'
import Profile from './pages/Profile'
import SharedProcesses from './pages/SharedProcesses'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <SidebarProvider>
            <ProtectedRoute>
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<MyScreenings />} />
                  <Route path="shared" element={<SharedProcesses />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
              </Routes>
            </ProtectedRoute>
          </SidebarProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
