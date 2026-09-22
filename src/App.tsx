import { Routes, Route, Outlet } from 'react-router-dom'
import AppShell from './layouts/AppShell'
import RootEffects from './components/RootEffects'
import RequireArea from './components/RequireArea'
import RequireAuth from './components/RequireAuth'
import Overview from './pages/Overview'
import FinancialCenter from './pages/Accounting/FinancialCenter'
import Login from './pages/Login'
import ApplicantsList from './pages/Applicants/ApplicantsList'
import ApplicantProfile from './pages/Applicants/ApplicantProfile'
import EmployersList from './pages/Employers/EmployersList'
import AgenciesList from './pages/Agencies/AgenciesList'
import AgentsList from './pages/Agents/AgentsList'
import RequestsList from './pages/Requests/RequestsList'
import RequestDetail from './pages/Requests/RequestDetail'
import InvoicesList from './pages/Invoices/InvoicesList'
import StaffList from './pages/Staff/StaffList'
import PayrollPage from './pages/Accounting/PayrollPage'
import AgencyAccountsPage from './pages/Accounting/AgencyAccountsPage'
import OfficeExpensesPage from './pages/Accounting/OfficeExpensesPage'
import AccountingReports from './pages/Accounting/AccountingReports'
import BackoutsPage from './pages/Accounting/BackoutsPage'
import AddonsPage from './pages/Addons/AddonsPage'
import Reports from './pages/Reports'
import Notifications from './pages/Notifications'
import Settings from './pages/Settings'
import Account from './pages/Account'
import NotFound from './pages/NotFound'

function App() {
  return (
    <>
      <RootEffects />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<RequireAuth><AppShell /></RequireAuth>}>
          <Route element={<RequireArea><Outlet /></RequireArea>}>
          <Route path="/" element={<Overview />} />
          <Route path="/applicants" element={<ApplicantsList />} />
          <Route path="/applicants/:id" element={<ApplicantProfile />} />
          <Route path="/employers" element={<EmployersList />} />
          <Route path="/agencies" element={<AgenciesList />} />
          <Route path="/agents" element={<AgentsList />} />
          <Route path="/recruitments" element={<RequestsList />} />
          <Route path="/recruitments/:id" element={<RequestDetail />} />
          <Route path="/invoices" element={<InvoicesList />} />
          <Route path="/staff" element={<StaffList />} />
          <Route path="/accounting" element={<FinancialCenter />} />
          <Route path="/accounting/payroll" element={<PayrollPage />} />
          <Route path="/accounting/agency-accounts" element={<AgencyAccountsPage />} />
          <Route path="/accounting/office-expenses" element={<OfficeExpensesPage />} />
          <Route path="/accounting/backouts" element={<BackoutsPage />} />
          <Route path="/accounting/reports" element={<AccountingReports />} />
          <Route path="/addons/:tab" element={<AddonsPage />} />
          <Route path="/addons" element={<AddonsPage />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/account" element={<Account />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Route>
      </Routes>
    </>
  )
}

export default App
