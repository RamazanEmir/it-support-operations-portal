import { Link, Route, Routes } from 'react-router'
import AppLayout from './components/layout/AppLayout'
import ProtectedRoute from './auth/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import AnalyticsPage from './pages/AnalyticsPage'
import UsersPage from './pages/UsersPage'
import AddUserPage from './pages/AddUserPage'
import EditUserPage from './pages/EditUserPage'
import TicketsPage from './pages/TicketsPage'
import CreateTicketPage from './pages/CreateTicketPage'
import TicketDetailsPage from './pages/TicketDetailsPage'
import DashboardPage from './pages/DashboardPage'
import ITRequestsPage from './pages/ITRequestsPage'
import CreateITRequestPage from './pages/CreateITRequestPage'
import ITRequestDetailsPage from './pages/ITRequestDetailsPage'
import EditITRequestPage from './pages/EditITRequestPage'
import AssetsPage from './pages/AssetsPage'
import CreateAssetPage from './pages/CreateAssetPage'
import AssetDetailsPage from './pages/AssetDetailsPage'
import EditAssetPage from './pages/EditAssetPage'
import AssignmentsPage from './pages/AssignmentsPage'
import CreateAssignmentPage from './pages/CreateAssignmentPage'
import AssignmentDetailsPage from './pages/AssignmentDetailsPage'
import WorkLogsPage from './pages/WorkLogsPage'
import CreateWorkLogPage from './pages/CreateWorkLogPage'
import WorkLogDetailsPage from './pages/WorkLogDetailsPage'
import EditWorkLogPage from './pages/EditWorkLogPage'
import KnowledgeBasePage from './pages/KnowledgeBasePage'
import CreateKnowledgeBaseArticlePage from './pages/CreateKnowledgeBaseArticlePage'
import KnowledgeBaseArticleDetailsPage from './pages/KnowledgeBaseArticleDetailsPage'
import EditKnowledgeBaseArticlePage from './pages/EditKnowledgeBaseArticlePage'

function App() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="analytics" element={<ProtectedRoute allowedRoles={['admin', 'technician']}><AnalyticsPage /></ProtectedRoute>} />
        <Route path="knowledge-base" element={<KnowledgeBasePage />} />
        <Route path="knowledge-base/new" element={<ProtectedRoute allowedRoles={['admin', 'technician']}><CreateKnowledgeBaseArticlePage /></ProtectedRoute>} />
        <Route path="knowledge-base/:id" element={<KnowledgeBaseArticleDetailsPage />} />
        <Route path="knowledge-base/:id/edit" element={<ProtectedRoute allowedRoles={['admin', 'technician']}><EditKnowledgeBaseArticlePage /></ProtectedRoute>} />
        <Route path="work-logs" element={<ProtectedRoute allowedRoles={['admin', 'technician']}><WorkLogsPage /></ProtectedRoute>} />
        <Route path="work-logs/new" element={<ProtectedRoute allowedRoles={['admin', 'technician']}><CreateWorkLogPage /></ProtectedRoute>} />
        <Route path="work-logs/:id" element={<ProtectedRoute allowedRoles={['admin', 'technician']}><WorkLogDetailsPage /></ProtectedRoute>} />
        <Route path="work-logs/:id/edit" element={<ProtectedRoute allowedRoles={['admin', 'technician']}><EditWorkLogPage /></ProtectedRoute>} />
        <Route path="assignments" element={<ProtectedRoute allowedRoles={['admin', 'technician']}><AssignmentsPage /></ProtectedRoute>} />
        <Route path="assignments/new" element={<ProtectedRoute allowedRoles={['admin', 'technician']}><CreateAssignmentPage /></ProtectedRoute>} />
        <Route path="assignments/:id" element={<ProtectedRoute allowedRoles={['admin', 'technician']}><AssignmentDetailsPage /></ProtectedRoute>} />
        <Route path="assets" element={<ProtectedRoute allowedRoles={['admin', 'technician']}><AssetsPage /></ProtectedRoute>} />
        <Route path="assets/new" element={<ProtectedRoute allowedRoles={['admin', 'technician']}><CreateAssetPage /></ProtectedRoute>} />
        <Route path="assets/:id" element={<ProtectedRoute allowedRoles={['admin', 'technician']}><AssetDetailsPage /></ProtectedRoute>} />
        <Route path="assets/:id/edit" element={<ProtectedRoute allowedRoles={['admin', 'technician']}><EditAssetPage /></ProtectedRoute>} />
        <Route path="it-requests" element={<ITRequestsPage />} />
        <Route path="it-requests/new" element={<CreateITRequestPage />} />
        <Route path="it-requests/:id" element={<ITRequestDetailsPage />} />
        <Route path="it-requests/:id/edit" element={<ProtectedRoute allowedRoles={['admin', 'technician']}><EditITRequestPage /></ProtectedRoute>} />
        <Route path="users" element={<ProtectedRoute allowedRoles={['admin']}><UsersPage /></ProtectedRoute>} />
        <Route path="users/new" element={<ProtectedRoute allowedRoles={['admin']}><AddUserPage /></ProtectedRoute>} />
        <Route path="users/:id/edit" element={<ProtectedRoute allowedRoles={['admin']}><EditUserPage /></ProtectedRoute>} />
        <Route path="tickets" element={<TicketsPage />} />
        <Route path="tickets/new" element={<CreateTicketPage />} />
        <Route path="tickets/:id" element={<TicketDetailsPage />} />
        <Route path="*" element={
          <section>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Page not found</h1>
            <p className="mt-1.5 text-sm text-slate-500">The requested page does not exist.</p>
            <Link to="/" className="mt-5 inline-block rounded-md text-sm font-medium text-blue-700 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">Return to home</Link>
          </section>
        } />
      </Route>
      </Route>
    </Routes>
  )
}

export default App
