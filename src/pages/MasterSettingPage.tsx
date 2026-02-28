import MasterDesignationSection from '../components/MasterDesignationSection'
import MasterEmploymentTypeSection from '../components/MasterEmploymentTypeSection'
import MasterLeaveTypeSection from '../components/MasterLeaveTypeSection'

function MasterSettingPage() {
  return (
    <div className="space-y-4">
      <MasterEmploymentTypeSection />
      <MasterDesignationSection />
      <MasterLeaveTypeSection />
    </div>
  )
}

export default MasterSettingPage
