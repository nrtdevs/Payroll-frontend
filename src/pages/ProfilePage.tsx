import { Avatar, Button, Card, CardContent, Chip, Divider, Grid, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useContext, useEffect, useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import { API_URL } from '../config/env'
import useAuth from '../context/useAuth'
import { ColorModeContext } from '../context/colorMode'
import useToast from '../context/useToast'
import { faceService } from '../services/faceService'
import { userService } from '../services/userService'
import type { User, UserDocument } from '../services/userService'

const renderValue = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '-'
  return String(value)
}

const getDocumentEndpoint = (userId: number, documentId: number): string => `${API_URL}/users/${userId}/documents/${documentId}`

const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function ProfileDocumentCard({ userId, document, label }: { userId: number; document: UserDocument; label?: string }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState('')
  const canPreviewImage = document.content_type.toLowerCase().startsWith('image/')

  useEffect(() => {
    let objectUrl: string | null = null
    let active = true

    const loadPreview = async () => {
      if (!canPreviewImage) return
      const token = localStorage.getItem('auth_token')
      if (!token) return
      try {
        const response = await fetch(getDocumentEndpoint(userId, document.id), {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!response.ok) throw new Error(`Preview failed (${response.status})`)
        const blob = await response.blob()
        objectUrl = URL.createObjectURL(blob)
        if (active) {
          setPreviewUrl(objectUrl)
          setPreviewError('')
        }
      } catch (error) {
        if (active) {
          setPreviewError(error instanceof Error ? error.message : 'Preview unavailable.')
        }
      }
    }

    void loadPreview()
    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [userId, document.id, canPreviewImage])

  const onDownload = async () => {
    const token = localStorage.getItem('auth_token')
    if (!token) return
    try {
      const response = await fetch(getDocumentEndpoint(userId, document.id), {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error(`Download failed (${response.status})`)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = window.document.createElement('a')
      link.href = url
      link.download = document.original_filename || `document-${document.id}`
      window.document.body.appendChild(link)
      link.click()
      window.document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch {
      // Keep metadata visible even if download fails.
    }
  }

  return (
    <Card variant="outlined">
      <CardContent className="space-y-2">
        {label ? (
          <Typography variant="body2" className="!font-semibold">
            {label}
          </Typography>
        ) : null}
        <Typography variant="body2">{document.original_filename}</Typography>
        <Typography variant="caption" color="text.secondary">
          {document.document_type} | {document.content_type} | {formatBytes(document.file_size)}
        </Typography>
        {previewUrl ? (
          <img src={previewUrl} alt={document.original_filename} className="max-h-64 w-full rounded-lg object-contain bg-slate-100" />
        ) : null}
        {canPreviewImage && !previewUrl && previewError ? (
          <Typography variant="caption" color="warning.main">
            {previewError}
          </Typography>
        ) : null}
        <Stack direction="row" justifyContent="flex-end">
          <Button size="small" variant="outlined" onClick={() => void onDownload()}>
            Download
          </Button>
        </Stack>
      </CardContent>
    </Card>
  )
}

function ProfilePage() {
  const { authState } = useAuth()
  const { mode } = useContext(ColorModeContext)
  const { showToast } = useToast()
  const user = authState.user
  const isDark = mode === 'dark'
  const [detailedUser, setDetailedUser] = useState<User | null>(null)
  const [faceImageFile, setFaceImageFile] = useState<File | null>(null)
  const [isEnrollingFace, setIsEnrollingFace] = useState(false)

  useEffect(() => {
    const loadCurrentUser = async () => {
      if (!user?.id) return
      try {
        const allUsers = await userService.getUsers()
        const current = allUsers.find((item) => item.id === user.id) ?? null
        setDetailedUser(current)
      } catch {
        setDetailedUser(null)
      }
    }
    void loadCurrentUser()
  }, [user?.id])

  if (!user) {
    return (
      <Card className="!rounded-2xl">
        <CardContent>
          <Typography variant="h6" className="!font-semibold">
            Profile
          </Typography>
          <Typography variant="body2" color="text.secondary" className="!mt-2">
            User details not available.
          </Typography>
        </CardContent>
      </Card>
    )
  }

  const userData = detailedUser ?? user
  const profileRows = [
    { label: 'Employee ID', value: userData.id },
    { label: 'Username', value: userData.username },
    { label: 'Email', value: userData.email },
    { label: 'Role', value: userData.role },
    { label: 'Status', value: userData.status },
    { label: 'Business ID', value: userData.business_id },
    { label: 'Branch ID', value: userData.branch_id },
    { label: 'Role ID', value: userData.role_id },
    { label: 'Salary Type', value: userData.salary_type },
    { label: 'Salary', value: userData.salary },
    { label: 'Leave Balance', value: userData.leave_balance },
    { label: 'Mobile', value: userData.mobile },
    { label: 'Alternate Number', value: userData.number },
    { label: 'PAN', value: userData.pan },
    { label: 'Aadhaar', value: userData.aadhaar },
    { label: 'Father Name', value: userData.father_name },
    { label: 'Mother Name', value: userData.mother_name },
    { label: 'Current Address', value: userData.current_address },
    { label: 'Home Address', value: userData.home_address },
    { label: 'Created At', value: userData.created_at },
  ]
  const initials = (userData.name || userData.username || userData.email || 'U').trim().charAt(0).toUpperCase()

  const profileImageDoc = useMemo(
    () => detailedUser?.documents?.find((document) => document.document_type === 'PROFILE_IMAGE') ?? null,
    [detailedUser?.documents],
  )
  const educationDocs = useMemo(
    () =>
      detailedUser?.educations?.flatMap((education, index) =>
        education.documents.map((document) => ({
          document,
          label: `Education ${index + 1}: ${education.degree || education.institution || 'Record'}`,
        })),
      ) ?? [],
    [detailedUser?.educations],
  )
  const companyDocs = useMemo(
    () =>
      detailedUser?.previous_companies?.flatMap((company, index) =>
        company.documents.map((document) => ({
          document,
          label: `Company ${index + 1}: ${company.company_name || company.designation || 'Record'}`,
        })),
      ) ?? [],
    [detailedUser?.previous_companies],
  )

  const onSelectFaceImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    setFaceImageFile(file)
  }

  const onEnrollFace = async () => {
    if (!faceImageFile) {
      showToast('Please select an image before uploading.', 'error')
      return
    }
    if (!faceImageFile.type.toLowerCase().startsWith('image/')) {
      showToast('Only image files are allowed for face enrollment.', 'error')
      return
    }

    setIsEnrollingFace(true)
    try {
      const message = await faceService.enrollFace(faceImageFile)
      showToast(message || 'Face enrolled successfully.', 'success')
      setFaceImageFile(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to enroll face.'
      showToast(message, 'error')
    } finally {
      setIsEnrollingFace(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden !rounded-2xl">
        <div
          className="px-6 py-6 text-white"
          style={{
            background: isDark
              ? 'linear-gradient(112deg, #10273f 0%, #173352 50%, #113850 100%)'
              : 'linear-gradient(112deg, #115e59 0%, #0f766e 50%, #0e7490 100%)',
          }}
        >
          <Typography variant="overline" className="!tracking-[0.14em]" sx={{ color: alpha('#fff', 0.76) }}>
            Employee Profile
          </Typography>
          <Typography variant="h5" className="!font-semibold">
            {renderValue(userData.name)}
          </Typography>
          <Typography variant="body2" className="!mt-1" sx={{ color: alpha('#fff', 0.86) }}>
            Official account details and employee records
          </Typography>
        </div>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', md: 'center' }}>
            <Avatar
              className="!h-16 !w-16 !text-xl !font-semibold"
              sx={{ bgcolor: isDark ? '#0e7490' : '#0f766e', color: '#f8fafc' }}
            >
              {initials}
            </Avatar>
            <div>
              <Typography variant="h6" className="!font-semibold">
                {renderValue(userData.name)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {renderValue(userData.email)}
              </Typography>
            </div>
            <Stack direction="row" spacing={1} className="md:!ml-auto">
              <Chip label={`Role: ${renderValue(userData.role)}`} color="primary" variant="outlined" />
              <Chip label={`Status: ${renderValue(userData.status)}`} color="success" variant="outlined" />
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Card className="!rounded-2xl">
        <CardContent>
          <Typography variant="h6" className="!font-semibold">
            Employee Information
          </Typography>
          <Divider className="!my-3" />
          <Grid container spacing={2}>
            {profileRows.map((item) => (
              <Grid key={item.label} size={{ xs: 12, sm: 6, md: 4 }}>
                <div
                  className="rounded-lg p-3"
                  style={{
                    border: `1px solid ${isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(148, 163, 184, 0.36)'}`,
                    background: isDark ? 'rgba(15, 23, 42, 0.4)' : 'rgba(248, 250, 252, 0.9)',
                  }}
                >
                  <Typography
                    variant="caption"
                    className="!uppercase !tracking-wide"
                    sx={{ color: isDark ? 'rgba(148, 163, 184, 0.9)' : 'rgba(71, 85, 105, 0.9)' }}
                  >
                    {item.label}
                  </Typography>
                  <Typography variant="body2" className="!mt-1 !font-medium">
                    {renderValue(item.value)}
                  </Typography>
                </div>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      <Card className="!rounded-2xl">
        <CardContent className="space-y-4">
          <Typography variant="h6" className="!font-semibold">
            Face Enrollment For Attendance
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Upload your selfie to enroll your face for attendance recognition.
          </Typography>
          <Divider />
          <Stack spacing={2} direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'stretch', md: 'center' }}>
            <Button variant="outlined" component="label" disabled={isEnrollingFace}>
              Choose Image
              <input hidden type="file" accept="image/*" onChange={onSelectFaceImage} />
            </Button>
            <Typography variant="body2" color="text.secondary">
              {faceImageFile ? faceImageFile.name : 'No file selected.'}
            </Typography>
            <Button variant="contained" onClick={() => void onEnrollFace()} disabled={!faceImageFile || isEnrollingFace}>
              {isEnrollingFace ? 'Uploading...' : 'Upload For Face Enrollment'}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {detailedUser ? (
        <Card className="!rounded-2xl">
          <CardContent className="space-y-4">
            <Typography variant="h6" className="!font-semibold">
              Uploaded Documents
            </Typography>
            <Divider />

            {profileImageDoc ? (
              <>
                <Typography variant="subtitle1" className="!font-semibold">
                  Profile Image
                </Typography>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <ProfileDocumentCard userId={detailedUser.id} document={profileImageDoc} />
                </div>
              </>
            ) : null}

            <Typography variant="subtitle1" className="!font-semibold">
              General Documents
            </Typography>
            {detailedUser.documents && detailedUser.documents.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {detailedUser.documents.map((document) => (
                  <ProfileDocumentCard key={`profile-doc-${document.id}`} userId={detailedUser.id} document={document} />
                ))}
              </div>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No general documents.
              </Typography>
            )}

            <Typography variant="subtitle1" className="!font-semibold">
              Education Documents
            </Typography>
            {educationDocs.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {educationDocs.map(({ document, label }) => (
                  <ProfileDocumentCard key={`profile-edu-doc-${document.id}`} userId={detailedUser.id} document={document} label={label} />
                ))}
              </div>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No education documents.
              </Typography>
            )}

            <Typography variant="subtitle1" className="!font-semibold">
              Experience Documents
            </Typography>
            {companyDocs.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {companyDocs.map(({ document, label }) => (
                  <ProfileDocumentCard key={`profile-cmp-doc-${document.id}`} userId={detailedUser.id} document={document} label={label} />
                ))}
              </div>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No experience documents.
              </Typography>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

export default ProfilePage
