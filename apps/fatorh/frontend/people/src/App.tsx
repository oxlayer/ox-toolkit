import './index.css'

import { BrowserRouter, Routes, Route } from "react-router"
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query"
import { SidebarProvider } from "./contexts/SidebarContext"
import { WorkspaceProvider } from "./contexts/WorkspaceContext"
import { AuthProvider } from "./contexts/AuthContext"
import Layout from "./components/Layout"
import AdminDashboard from "./pages/AdminDashboard"
import Exams from "./pages/admin/Exams"
import Templates from "./pages/admin/Templates"
import ExamDetails from "./pages/admin/ExamDetails"
import UserInterviewDetail from "./pages/admin/UserInterviewDetail"
import Tags from "./pages/admin/Tags"
import UsersByTags from "./pages/admin/UsersByTags"
import ProtectedRoute from './components/ProtectedRoute'
import { Toaster } from './components/Toaster'
import { ErrorBoundary } from './components/ErrorBoundary'
import { toast } from 'sonner'

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      toast.error(error.message || 'An error occurred while fetching data');
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      toast.error(error.message || 'An error occurred while saving data');
    },
  }),
})

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Toaster />
        <BrowserRouter>
          <AuthProvider>
            <WorkspaceProvider>
              <SidebarProvider>
                <ProtectedRoute>
                  <Routes>
                    <Route path="/" element={<Layout />}>
                      <Route index element={<AdminDashboard />} />
                      <Route path="exames" element={<Exams />} />
                      <Route path="exames/:examId" element={<ExamDetails />} />
                      <Route path="exames/:examId/users/:userId" element={<UserInterviewDetail />} />
                      <Route path="templates" element={<Templates />} />
                      <Route path="configuracoes/tags" element={<Tags />} />
                      <Route path="configuracoes/usuarios-por-tags" element={<UsersByTags />} />
                    </Route>
                  </Routes>
                </ProtectedRoute>
              </SidebarProvider>
            </WorkspaceProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
