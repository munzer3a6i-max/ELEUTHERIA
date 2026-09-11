import { Routes, Route } from 'react-router-dom'
import AppShell from './layouts/AppShell'
import RootEffects from './components/RootEffects'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import ApplicantsList from './pages/Applicants/ApplicantsList'
import ApplicantProfile from './pages/Applicants/ApplicantProfile'
import EmployersList from './pages/Employers/EmployersList'
import AgenciesList from './pages/Agencies/AgenciesList'
import RequestsList from './pages/Requests/RequestsList'
import RequestDetail from './pages/Requests/RequestDetail'
import InvoicesList from './pages/Invoices/InvoicesList'
import StaffList from './pages/Staff/StaffList'
import AddonsPage from './pages/Addons/AddonsPage'
import Reports from './pages/Reports'
import Notifications from './pages/Notifications'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'

function App() {
  return (
    <>
      <RootEffects />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<AppShell />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/applicants" element={<ApplicantsList />} />
          <Route path="/applicants/:id" element={<ApplicantProfile />} />
          <Route path="/employers" element={<EmployersList />} />
          <Route path="/agencies" element={<AgenciesList />} />
          <Route path="/recruitments" element={<RequestsList />} />
          <Route path="/recruitments/:id" element={<RequestDetail />} />
          <Route path="/invoices" element={<InvoicesList />} />
          <Route path="/staff" element={<StaffList />} />
          <Route path="/addons/:tab" element={<AddonsPage />} />
          <Route path="/addons" element={<AddonsPage />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  )
}

export default App
