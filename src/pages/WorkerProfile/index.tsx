import { useState } from 'react'
import AppShell from '../../layouts/AppShell'
import Breadcrumb from './Breadcrumb'
import WorkerHeader from './WorkerHeader'
import ProfileTabs from './ProfileTabs'
import RecruitmentTimeline from './RecruitmentTimeline'
import FinancialCenter from './FinancialCenter'
import StatusBarFooter from './StatusBarFooter'

export default function WorkerProfilePage() {
  const [activeTab, setActiveTab] = useState('financial')

  return (
    <AppShell>
      <div className="flex flex-col gap-4 p-4">
        <Breadcrumb />
        <WorkerHeader />
        <ProfileTabs active={activeTab} onChange={setActiveTab} />

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-3">
            <RecruitmentTimeline />
          </div>
          <div className="col-span-9">
            <FinancialCenter />
          </div>
        </div>

        <StatusBarFooter />
      </div>
    </AppShell>
  )
}
