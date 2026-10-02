import { Link, Route, Routes } from 'react-router'
import AppLayout from './components/layout/AppLayout'
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

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="work-logs" element={<WorkLogsPage />} />
        <Route path="work-logs/new" element={<CreateWorkLogPage />} />
        <Route path="work-logs/:id" element={<WorkLogDetailsPage />} />
        <Route path="work-logs/:id/edit" element={<EditWorkLogPage />} />
        <Route path="assignments" element={<AssignmentsPage />} />
        <Route path="assignments/new" element={<CreateAssignmentPage />} />
        <Route path="assignments/:id" element={<AssignmentDetailsPage />} />
        <Route path="assets" element={<AssetsPage />} />
        <Route path="assets/new" element={<CreateAssetPage />} />
        <Route path="assets/:id" element={<AssetDetailsPage />} />
        <Route path="assets/:id/edit" element={<EditAssetPage />} />
        <Route path="it-requests" element={<ITRequestsPage />} />
        <Route path="it-requests/new" element={<CreateITRequestPage />} />
        <Route path="it-requests/:id" element={<ITRequestDetailsPage />} />
        <Route path="it-requests/:id/edit" element={<EditITRequestPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="users/new" element={<AddUserPage />} />
        <Route path="users/:id/edit" element={<EditUserPage />} />
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
    </Routes>
  )
}

export default App
