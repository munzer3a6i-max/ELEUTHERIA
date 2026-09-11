import { Routes, Route } from 'react-router-dom'
import AppShell from './layouts/AppShell'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import WorkersList from './pages/Workers/WorkersList'
import WorkerProfilePage from './pages/WorkerProfile'
import ClientsList from './pages/Clients/ClientsList'
import ApplicationsList from './pages/Applications/ApplicationsList'
import RecruitmentStagesBoard from './pages/RecruitmentStages/RecruitmentStagesBoard'
import IncomePage from './pages/Accounting/IncomePage'
import ExpensesPage from './pages/Accounting/ExpensesPage'
import PaymentsPage from './pages/Accounting/PaymentsPage'
import DocumentsPage from './pages/Accounting/DocumentsPage'
import Reports from './pages/Reports'
import StaffList from './pages/Staff/StaffList'
import Notifications from './pages/Notifications'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<AppShell />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/workers" element={<WorkersList />} />
        <Route path="/workers/:id" element={<WorkerProfilePage />} />
        <Route path="/clients" element={<ClientsList />} />
        <Route path="/applications" element={<ApplicationsList />} />
        <Route path="/recruitment-stages" element={<RecruitmentStagesBoard />} />
        <Route path="/accounting/income" element={<IncomePage />} />
        <Route path="/accounting/expenses" element={<ExpensesPage />} />
        <Route path="/accounting/payments" element={<PaymentsPage />} />
        <Route path="/accounting/documents" element={<DocumentsPage />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/staff" element={<StaffList />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

export default App
