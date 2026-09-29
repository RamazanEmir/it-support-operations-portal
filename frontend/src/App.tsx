import { Link, Route, Routes } from 'react-router'
import AppLayout from './components/layout/AppLayout'
import UsersPage from './pages/UsersPage'
import AddUserPage from './pages/AddUserPage'
import EditUserPage from './pages/EditUserPage'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={null} />
        <Route path="users" element={<UsersPage />} />
        <Route path="users/new" element={<AddUserPage />} />
        <Route path="users/:id/edit" element={<EditUserPage />} />
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
