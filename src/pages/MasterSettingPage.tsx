import { Alert } from '@mui/material'
import { useMemo } from 'react'
import useAuth from '../context/useAuth'
import MasterDesignationSection from '../components/MasterDesignationSection'
import MasterEmploymentTypeSection from '../components/MasterEmploymentTypeSection'
import MasterLeaveTypeSection from '../components/MasterLeaveTypeSection'

function MasterSettingPage() {
  const { authState } = useAuth()
  const permissionSet = useMemo(
    () => new Set((authState.rolePermissions?.permissions ?? []).map((permission) => permission.name)),
    [authState.rolePermissions],
  )

  const canListEmploymentType = permissionSet.has('EMPLOYMENT_TYPE_LIST')
  const canCreateEmploymentType = permissionSet.has('EMPLOYMENT_TYPE_CREATE')
  const canUpdateEmploymentType = permissionSet.has('EMPLOYMENT_TYPE_UPDATE')
  const canDeleteEmploymentType = permissionSet.has('EMPLOYMENT_TYPE_DELETE')

  const canListDesignation = permissionSet.has('DESIGNATION_LIST')
  const canCreateDesignation = permissionSet.has('DESIGNATION_CREATE')
  const canUpdateDesignation = permissionSet.has('DESIGNATION_UPDATE')
  const canDeleteDesignation = permissionSet.has('DESIGNATION_DELETE')

  const canListLeaveType = permissionSet.has('LEAVE_TYPE_LIST')

  const hasAnySectionAccess = canListEmploymentType || canListDesignation || canListLeaveType

  return (
    <div className="space-y-4">
      {!hasAnySectionAccess ? (
        <Alert severity="warning">You do not have permission to view master setting tables.</Alert>
      ) : null}

      {canListEmploymentType ? (
        <MasterEmploymentTypeSection
          canCreate={canCreateEmploymentType}
          canUpdate={canUpdateEmploymentType}
          canDelete={canDeleteEmploymentType}
        />
      ) : null}

      {canListDesignation ? (
        <MasterDesignationSection canCreate={canCreateDesignation} canUpdate={canUpdateDesignation} canDelete={canDeleteDesignation} />
      ) : null}

      {canListLeaveType ? <MasterLeaveTypeSection /> : null}
    </div>
  )
}

export default MasterSettingPage
