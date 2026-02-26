import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TableCell,
  Tooltip,
  Typography,
} from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import { API_URL } from '../config/env'
import { branchService } from '../services/branchService'
import { roleService } from '../services/roleService'
import { userService } from '../services/userService'
import type { Branch } from '../services/branchService'
import type { Role } from '../services/roleService'
import type { CreateUserPayload, User, UserDocument, UserListFilters, UserPayload } from '../services/userService'
import CustomAutocomplete, { type CustomAutocompleteOption } from '../components/CustomAutocomplete'
import CustomInput from '../components/CustomInput'
import CustomTable, { type CustomTableColumn } from '../components/CustomTable'
import CustomLoader from '../components/CustomLoader'
import useToast from '../context/useToast'

const emptyUserForm: CreateUserPayload = {
  name: '',
  branch_id: null,
  role_id: null,
  salary_type: 'MONTHLY',
  salary: null,
  leave_balance: null,
  status: 'ACTIVE',
  current_address: '',
  home_address: '',
  pan: '',
  aadhaar: '',
  mobile: '',
  number: '',
  email: '',
  password: '',
  father_name: '',
  mother_name: '',
  business_id: null,
}

const toNullableNumber = (value: string): number | null => {
  const trimmed = value.trim()
  if (trimmed === '') return null
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

type BankAccountForm = {
  account_holder_name: string
  account_number: string
  ifsc_code: string
  bank_name: string
}

type EducationForm = {
  id: string
  source_id: number | null
  record_key: string
  degree: string
  institution: string
  year_of_passing: string
  percentage: string
}

type PreviousCompanyForm = {
  id: string
  source_id: number | null
  record_key: string
  company_name: string
  designation: string
  start_date: string
  end_date: string
}

type RowFileMap = Record<string, File[]>
type GeneralDocumentFieldKey = 'profile_image' | 'aadhaar_copy' | 'pan_copy' | 'bank_proof'

const emptyBankAccountForm: BankAccountForm = {
  account_holder_name: '',
  account_number: '',
  ifsc_code: '',
  bank_name: '',
}

const createEducationForm = (seq: number): EducationForm => ({
  id: `edu_row_${seq}`,
  source_id: null,
  record_key: `edu_${seq}`,
  degree: '',
  institution: '',
  year_of_passing: '',
  percentage: '',
})

const createPreviousCompanyForm = (seq: number): PreviousCompanyForm => ({
  id: `cmp_row_${seq}`,
  source_id: null,
  record_key: `cmp_${seq}`,
  company_name: '',
  designation: '',
  start_date: '',
  end_date: '',
})

const isEducationFilled = (form: EducationForm): boolean => {
  return Boolean(form.degree.trim() || form.institution.trim() || form.year_of_passing.trim() || form.percentage.trim())
}

const isCompanyFilled = (form: PreviousCompanyForm): boolean => {
  return Boolean(form.company_name.trim() || form.designation.trim() || form.start_date.trim() || form.end_date.trim())
}

const getUniqueRecordKey = (raw: string, fallbackPrefix: string, index: number, used: Set<string>): string => {
  const base = raw.trim() || `${fallbackPrefix}_${index + 1}`
  if (!used.has(base)) {
    used.add(base)
    return base
  }
  let suffix = 2
  while (used.has(`${base}_${suffix}`)) {
    suffix += 1
  }
  const unique = `${base}_${suffix}`
  used.add(unique)
  return unique
}

const getDocumentEndpoint = (userId: number, documentId: number): string => `${API_URL}/users/${userId}/documents/${documentId}`
const GENERAL_DOCUMENT_TYPE_MAP: Record<GeneralDocumentFieldKey, string[]> = {
  profile_image: ['PROFILE_IMAGE'],
  aadhaar_copy: ['AADHAAR_COPY', 'AADHAR_COPY'],
  pan_copy: ['PAN_COPY'],
  bank_proof: ['BANK_PROOF'],
}
const GENERAL_DOCUMENT_FIELD_CONFIG: Array<{ key: GeneralDocumentFieldKey; label: string; accept?: string }> = [
  { key: 'profile_image', label: 'Profile Image', accept: 'image/*' },
  { key: 'aadhaar_copy', label: 'Aadhaar Copy' },
  { key: 'pan_copy', label: 'PAN Copy' },
  { key: 'bank_proof', label: 'Bank Proof' },
]
const GENERAL_DOCUMENT_TYPE_SET = new Set(Object.values(GENERAL_DOCUMENT_TYPE_MAP).flat().map((type) => type.toUpperCase()))

const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const getFilesFromInputEvent = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): FileList | null => {
  const target = event.target as HTMLInputElement
  return target.files ?? null
}

const getExistingGeneralDocument = (
  documents: UserDocument[] | null | undefined,
  fieldKey: GeneralDocumentFieldKey,
  removedIds: number[],
): UserDocument | null => {
  if (!documents || documents.length === 0) return null
  const allowedTypes = GENERAL_DOCUMENT_TYPE_MAP[fieldKey].map((type) => type.toUpperCase())
  return (
    documents.find((document) => {
      if (removedIds.includes(document.id)) return false
      return allowedTypes.includes(document.document_type.toUpperCase())
    }) ?? null
  )
}

function DocumentCard({ userId, document, label }: { userId: number; document: UserDocument; label?: string }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState('')
  const canPreviewImage = document.content_type.toLowerCase().startsWith('image/')

  useEffect(() => {
    let objectUrl: string | null = null
    let active = true

    const loadPreview = async () => {
      if (!canPreviewImage) return
      const token = localStorage.getItem('auth_token')
      if (!token) {
        if (active) setPreviewError('Auth token missing.')
        return
      }
      try {
        const response = await fetch(getDocumentEndpoint(userId, document.id), {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!response.ok) {
          throw new Error(`Preview failed (${response.status})`)
        }
        const blob = await response.blob()
        objectUrl = URL.createObjectURL(blob)
        if (active) {
          setPreviewUrl(objectUrl)
          setPreviewError('')
        }
      } catch (error) {
        if (active) {
          const message = error instanceof Error ? error.message : 'Preview unavailable.'
          setPreviewError(message)
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
      if (!response.ok) {
        throw new Error(`Download failed (${response.status})`)
      }
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
      // ignore here; metadata is still shown
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

function InlineExistingFile({ userId, document, onRemove }: { userId: number; document: UserDocument; onRemove?: () => void }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
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
        if (!response.ok) return
        const blob = await response.blob()
        objectUrl = URL.createObjectURL(blob)
        if (active) setPreviewUrl(objectUrl)
      } catch {
        // keep only filename if preview fails
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
      if (!response.ok) return
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
      // ignore download error
    }
  }

  return (
    <Card variant="outlined" className="md:col-span-2">
      <CardContent className="!py-3">
        <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
          <Stack spacing={0.5} className="min-w-0">
            <Typography variant="body2" className="truncate">
              Existing: {document.original_filename}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatBytes(document.file_size)}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button size="small" variant="outlined" onClick={() => void onDownload()}>
              Download
            </Button>
            {onRemove ? (
              <IconButton size="small" color="error" onClick={onRemove}>
                <CloseRoundedIcon fontSize="small" />
              </IconButton>
            ) : null}
          </Stack>
        </Stack>
        {previewUrl ? <img src={previewUrl} alt={document.original_filename} className="mt-2 max-h-28 w-full rounded object-contain bg-slate-100" /> : null}
      </CardContent>
    </Card>
  )
}

function UsersPage() {
  const { showToast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [userError, setUserError] = useState('')
  const [submittingUser, setSubmittingUser] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [branches, setBranches] = useState<Branch[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loadingFormOptions, setLoadingFormOptions] = useState(false)

  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [editingUserId, setEditingUserId] = useState<number | null>(null)
  const [userForm, setUserForm] = useState<CreateUserPayload>(emptyUserForm)
  const [bankAccountForm, setBankAccountForm] = useState<BankAccountForm>(emptyBankAccountForm)

  const [educationCounter, setEducationCounter] = useState(1)
  const [companyCounter, setCompanyCounter] = useState(1)
  const [educationForms, setEducationForms] = useState<EducationForm[]>([createEducationForm(1)])
  const [previousCompanyForms, setPreviousCompanyForms] = useState<PreviousCompanyForm[]>([createPreviousCompanyForm(1)])
  const [educationFilesByRowId, setEducationFilesByRowId] = useState<RowFileMap>({})
  const [companyFilesByRowId, setCompanyFilesByRowId] = useState<RowFileMap>({})

  const [profileImageFile, setProfileImageFile] = useState<File | null>(null)
  const [aadhaarCopyFile, setAadhaarCopyFile] = useState<File | null>(null)
  const [panCopyFile, setPanCopyFile] = useState<File | null>(null)
  const [bankProofFile, setBankProofFile] = useState<File | null>(null)
  const [removedGeneralDocumentIds, setRemovedGeneralDocumentIds] = useState<number[]>([])
  const [removedEducationDocumentIds, setRemovedEducationDocumentIds] = useState<number[]>([])
  const [removedCompanyDocumentIds, setRemovedCompanyDocumentIds] = useState<number[]>([])
  const [replacedEducationRowIds, setReplacedEducationRowIds] = useState<string[]>([])
  const [replacedCompanyRowIds, setReplacedCompanyRowIds] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalUsers, setTotalUsers] = useState(0)
  const [filterDraft, setFilterDraft] = useState<UserListFilters>({ first_name: '', mobile_number: '', branch_id: null })
  const [filters, setFilters] = useState<UserListFilters>({ first_name: '', mobile_number: '', branch_id: null })

  const branchOptions: CustomAutocompleteOption<number>[] = branches.map((branch) => ({
    label: `${branch.name} (#${branch.id})`,
    value: branch.id,
  }))
  const roleOptions: CustomAutocompleteOption<number>[] = roles.map((role) => ({
    label: `${role.name} (#${role.id})`,
    value: role.id,
  }))
  const statusOptions: CustomAutocompleteOption<'ACTIVE' | 'INACTIVE'>[] = [
    { label: 'ACTIVE', value: 'ACTIVE' },
    { label: 'INACTIVE', value: 'INACTIVE' },
  ]
  const userColumns: CustomTableColumn[] = [
    { key: 'id', label: 'ID' },
    { key: 'username', label: 'Username' },
    { key: 'email', label: 'Email' },
    { key: 'name', label: 'Name' },
    { key: 'role', label: 'Role' },
    { key: 'status', label: 'Status' },
    { key: 'action', label: 'Action', align: 'right' },
  ]
  const editingUser = editingUserId !== null ? users.find((user) => user.id === editingUserId) ?? null : null

  const resetNestedForms = () => {
    setBankAccountForm(emptyBankAccountForm)
    setEducationCounter(1)
    setCompanyCounter(1)
    setEducationForms([createEducationForm(1)])
    setPreviousCompanyForms([createPreviousCompanyForm(1)])
    setEducationFilesByRowId({})
    setCompanyFilesByRowId({})
    setProfileImageFile(null)
    setAadhaarCopyFile(null)
    setPanCopyFile(null)
    setBankProofFile(null)
    setRemovedGeneralDocumentIds([])
    setRemovedEducationDocumentIds([])
    setRemovedCompanyDocumentIds([])
    setReplacedEducationRowIds([])
    setReplacedCompanyRowIds([])
  }

  const loadUsers = async () => {
    setLoadingUsers(true)
    setUserError('')
    try {
      const data = await userService.getUsersPaginated(page, rowsPerPage, filters)
      setUsers(data.items)
      setTotalUsers(data.total)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load users.'
      setUserError(message)
    } finally {
      setLoadingUsers(false)
    }
  }

  const loadFormOptions = async () => {
    setLoadingFormOptions(true)
    try {
      const [branchData, roleData] = await Promise.all([branchService.getBranches(), roleService.getRoles()])
      setBranches(branchData)
      setRoles(roleData)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load branch/role options.'
      setUserError(message)
    } finally {
      setLoadingFormOptions(false)
    }
  }

  useEffect(() => {
    void loadUsers()
  }, [page, rowsPerPage, filters])

  useEffect(() => {
    void loadFormOptions()
  }, [])

  const closeCreateModal = () => {
    setCreateOpen(false)
    setUserForm(emptyUserForm)
    resetNestedForms()
  }

  const closeEditModal = () => {
    setEditOpen(false)
    setEditingUserId(null)
    setUserForm(emptyUserForm)
    resetNestedForms()
  }

  const buildEducationPayload = () => {
    const educationFileMap: Record<string, number[]> = {}
    const educationFiles: File[] = []
    const usedRecordKeys = new Set<string>()

    const educations = educationForms
      .filter(isEducationFilled)
      .map((form, index) => {
        const recordKey = getUniqueRecordKey(form.record_key, 'edu', index, usedRecordKeys)
        const rowFiles = educationFilesByRowId[form.id] ?? []
        if (rowFiles.length > 0) {
          const start = educationFiles.length
          educationFiles.push(...rowFiles)
          educationFileMap[recordKey] = rowFiles.map((_, fileIndex) => start + fileIndex)
        }

        return {
          record_key: recordKey,
          degree: form.degree,
          institution: form.institution,
          year_of_passing: toNullableNumber(form.year_of_passing),
          percentage: toNullableNumber(form.percentage),
        }
      })

    return {
      educations,
      education_file_map: educationFileMap,
      education_marksheets: educationFiles,
    }
  }

  const buildCompanyPayload = () => {
    const companyFileMap: Record<string, number[]> = {}
    const companyFiles: File[] = []
    const usedRecordKeys = new Set<string>()

    const previous_companies = previousCompanyForms
      .filter(isCompanyFilled)
      .map((form, index) => {
        const recordKey = getUniqueRecordKey(form.record_key, 'cmp', index, usedRecordKeys)
        const rowFiles = companyFilesByRowId[form.id] ?? []
        if (rowFiles.length > 0) {
          const start = companyFiles.length
          companyFiles.push(...rowFiles)
          companyFileMap[recordKey] = rowFiles.map((_, fileIndex) => start + fileIndex)
        }

        return {
          record_key: recordKey,
          company_name: form.company_name,
          designation: form.designation,
          start_date: form.start_date,
          end_date: form.end_date,
        }
      })

    return {
      previous_companies,
      company_file_map: companyFileMap,
      experience_proofs: companyFiles,
    }
  }

  const onCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmittingUser(true)
    setUserError('')
    try {
      const payload: CreateUserPayload = {
        name: userForm.name,
        branch_id: userForm.branch_id,
        role_id: userForm.role_id,
        salary_type: userForm.salary_type,
        salary: userForm.salary,
        leave_balance: userForm.leave_balance,
        status: userForm.status,
        current_address: userForm.current_address,
        home_address: userForm.home_address,
        pan: userForm.pan,
        aadhaar: userForm.aadhaar,
        mobile: userForm.mobile,
        number: userForm.number,
        email: userForm.email,
        password: userForm.password,
        father_name: userForm.father_name,
        mother_name: userForm.mother_name,
        business_id: userForm.business_id,
      }

      const educationSubmission = buildEducationPayload()
      const companySubmission = buildCompanyPayload()

      await userService.createUser({
        payload: {
          ...payload,
          bank_account: { ...bankAccountForm },
          educations: educationSubmission.educations,
          previous_companies: companySubmission.previous_companies,
        },
        education_file_map: educationSubmission.education_file_map,
        company_file_map: companySubmission.company_file_map,
        files: {
          profile_image: profileImageFile,
          aadhaar_copy: aadhaarCopyFile,
          pan_copy: panCopyFile,
          bank_proof: bankProofFile,
          education_marksheets: educationSubmission.education_marksheets,
          experience_proofs: companySubmission.experience_proofs,
        },
      })

      closeCreateModal()
      showToast('User created successfully.', 'success')
      await loadUsers()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create user.'
      setUserError(message)
      showToast(message, 'error')
    } finally {
      setSubmittingUser(false)
    }
  }

  const onEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (editingUserId === null) return
    setSubmittingUser(true)
    setUserError('')
    try {
      const payload: UserPayload = {
        name: userForm.name,
        branch_id: userForm.branch_id,
        role_id: userForm.role_id,
        salary_type: userForm.salary_type,
        salary: userForm.salary,
        leave_balance: userForm.leave_balance,
        status: userForm.status,
        current_address: userForm.current_address,
        home_address: userForm.home_address,
        pan: userForm.pan,
        aadhaar: userForm.aadhaar,
        mobile: userForm.mobile,
        number: userForm.number,
        email: userForm.email,
        father_name: userForm.father_name,
        mother_name: userForm.mother_name,
        business_id: userForm.business_id,
      }

      const educationSubmission = buildEducationPayload()
      const companySubmission = buildCompanyPayload()

      await userService.updateUser(editingUserId, {
        payload: {
          ...payload,
          bank_account: { ...bankAccountForm },
          educations: educationSubmission.educations,
          previous_companies: companySubmission.previous_companies,
        },
        education_file_map: educationSubmission.education_file_map,
        company_file_map: companySubmission.company_file_map,
        files: {
          profile_image: profileImageFile,
          aadhaar_copy: aadhaarCopyFile,
          pan_copy: panCopyFile,
          bank_proof: bankProofFile,
          education_marksheets: educationSubmission.education_marksheets,
          experience_proofs: companySubmission.experience_proofs,
        },
      })

      closeEditModal()
      showToast('User updated successfully.', 'success')
      await loadUsers()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update user.'
      setUserError(message)
      showToast(message, 'error')
    } finally {
      setSubmittingUser(false)
    }
  }

  const onEditUser = (user: User) => {
    setEditingUserId(user.id)
    setUserForm({
      name: user.name || '',
      branch_id: user.branch_id ?? null,
      role_id: user.role_id ?? null,
      salary_type: user.salary_type || 'MONTHLY',
      salary: user.salary !== null && user.salary !== undefined ? Number(user.salary) : null,
      leave_balance: user.leave_balance ?? null,
      status: user.status || 'ACTIVE',
      current_address: user.current_address || '',
      home_address: user.home_address || '',
      pan: user.pan || '',
      aadhaar: user.aadhaar || '',
      mobile: user.mobile || '',
      number: user.number || '',
      email: user.email || '',
      password: '',
      father_name: user.father_name || '',
      mother_name: user.mother_name || '',
      business_id: user.business_id ?? null,
    })
    const nextBankAccount: BankAccountForm = user.bank_account
      ? {
          account_holder_name: user.bank_account.account_holder_name || '',
          account_number: user.bank_account.account_number || '',
          ifsc_code: user.bank_account.ifsc_code || '',
          bank_name: user.bank_account.bank_name || '',
        }
      : emptyBankAccountForm

    const nextEducations: EducationForm[] =
      user.educations && user.educations.length > 0
        ? user.educations.map((education, index) => ({
            id: `edu_existing_${education.id}`,
            source_id: education.id,
            record_key: `edu_${index + 1}`,
            degree: education.degree || '',
            institution: education.institution || '',
            year_of_passing: education.year_of_passing !== null && education.year_of_passing !== undefined ? String(education.year_of_passing) : '',
            percentage: education.percentage !== null && education.percentage !== undefined ? String(education.percentage) : '',
          }))
        : [createEducationForm(1)]

    const nextCompanies: PreviousCompanyForm[] =
      user.previous_companies && user.previous_companies.length > 0
        ? user.previous_companies.map((company, index) => ({
            id: `cmp_existing_${company.id}`,
            source_id: company.id,
            record_key: `cmp_${index + 1}`,
            company_name: company.company_name || '',
            designation: company.designation || '',
            start_date: company.start_date || '',
            end_date: company.end_date || '',
          }))
        : [createPreviousCompanyForm(1)]

    setBankAccountForm(nextBankAccount)
    setEducationForms(nextEducations)
    setPreviousCompanyForms(nextCompanies)
    setEducationCounter(nextEducations.length)
    setCompanyCounter(nextCompanies.length)
    setEducationFilesByRowId({})
    setCompanyFilesByRowId({})
    setProfileImageFile(null)
    setAadhaarCopyFile(null)
    setPanCopyFile(null)
    setBankProofFile(null)
    setRemovedGeneralDocumentIds([])
    setRemovedEducationDocumentIds([])
    setRemovedCompanyDocumentIds([])
    setReplacedEducationRowIds([])
    setReplacedCompanyRowIds([])
    setEditOpen(true)
  }

  const existingProfileImage = getExistingGeneralDocument(editingUser?.documents, 'profile_image', removedGeneralDocumentIds)
  const existingAadhaarCopy = getExistingGeneralDocument(editingUser?.documents, 'aadhaar_copy', removedGeneralDocumentIds)
  const existingPanCopy = getExistingGeneralDocument(editingUser?.documents, 'pan_copy', removedGeneralDocumentIds)
  const existingBankProof = getExistingGeneralDocument(editingUser?.documents, 'bank_proof', removedGeneralDocumentIds)
  const existingGeneralDocumentByField: Record<GeneralDocumentFieldKey, UserDocument | null> = {
    profile_image: existingProfileImage,
    aadhaar_copy: existingAadhaarCopy,
    pan_copy: existingPanCopy,
    bank_proof: existingBankProof,
  }
  const selectedGeneralFileByField: Record<GeneralDocumentFieldKey, File | null> = {
    profile_image: profileImageFile,
    aadhaar_copy: aadhaarCopyFile,
    pan_copy: panCopyFile,
    bank_proof: bankProofFile,
  }
  const remainingGeneralDocuments =
    editingUser?.documents?.filter((document) => {
      if (removedGeneralDocumentIds.includes(document.id)) return false
      return !GENERAL_DOCUMENT_TYPE_SET.has(document.document_type.toUpperCase())
    }) ?? []

  const onRemoveExistingGeneralDocument = (fieldKey: GeneralDocumentFieldKey) => {
    const document = existingGeneralDocumentByField[fieldKey]
    if (!document) return
    setRemovedGeneralDocumentIds((prev) => (prev.includes(document.id) ? prev : [...prev, document.id]))
  }

  const onGeneralFileChange = (fieldKey: GeneralDocumentFieldKey, file: File | null) => {
    if (fieldKey === 'profile_image') setProfileImageFile(file)
    if (fieldKey === 'aadhaar_copy') setAadhaarCopyFile(file)
    if (fieldKey === 'pan_copy') setPanCopyFile(file)
    if (fieldKey === 'bank_proof') setBankProofFile(file)
    if (file) {
      const existingDocument = existingGeneralDocumentByField[fieldKey]
      if (existingDocument) {
        setRemovedGeneralDocumentIds((prev) => (prev.includes(existingDocument.id) ? prev : [...prev, existingDocument.id]))
      }
    }
  }

  const onDeleteUser = async (user: User) => {
    const approved = window.confirm(`Delete user "${user.username || user.email || user.id}"?`)
    if (!approved) return

    setUserError('')
    try {
      await userService.deleteUser(user.id)
      if (selectedUser?.id === user.id) {
        setSelectedUser(null)
        setViewOpen(false)
      }
      await loadUsers()
      showToast('User deleted successfully.', 'success')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete user.'
      setUserError(message)
      showToast(message, 'error')
    }
  }

  const onFilterSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPage(1)
    setFilters({
      first_name: filterDraft.first_name?.trim() ?? '',
      mobile_number: filterDraft.mobile_number?.trim() ?? '',
      branch_id: filterDraft.branch_id ?? null,
    })
  }

  const onResetFilters = () => {
    const emptyFilters: UserListFilters = { first_name: '', mobile_number: '', branch_id: null }
    setFilterDraft(emptyFilters)
    setFilters(emptyFilters)
    setPage(1)
  }

  const userFormFields = (includePassword: boolean) => (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <CustomInput label="Name" value={userForm.name} onChange={(e) => setUserForm((p) => ({ ...p, name: e.target.value }))} required />
      <CustomAutocomplete
        label="Branch"
        required
        requiredMessage="Branch is required."
        options={branchOptions}
        value={userForm.branch_id}
        disabled={loadingFormOptions}
        onChange={(nextValue) => setUserForm((p) => ({ ...p, branch_id: nextValue }))}
      />
      <CustomAutocomplete
        label="Role"
        required
        requiredMessage="Role is required."
        options={roleOptions}
        value={userForm.role_id}
        disabled={loadingFormOptions}
        onChange={(nextValue) => setUserForm((p) => ({ ...p, role_id: nextValue }))}
      />
      <CustomAutocomplete
        label="Status"
        required
        requiredMessage="Status is required."
        options={statusOptions}
        value={userForm.status as 'ACTIVE' | 'INACTIVE'}
        onChange={(nextValue) => setUserForm((p) => ({ ...p, status: nextValue ?? 'ACTIVE' }))}
      />
      <CustomInput
        label="Salary Type"
        value={userForm.salary_type}
        onChange={(e) => setUserForm((p) => ({ ...p, salary_type: e.target.value }))}
        required
      />
      <CustomInput
        label="Salary"
        type="number"
        value={userForm.salary ?? ''}
        onChange={(e) => setUserForm((p) => ({ ...p, salary: toNullableNumber(e.target.value) }))}
        required
      />
      <CustomInput
        label="Leave Balance"
        type="number"
        value={userForm.leave_balance ?? ''}
        onChange={(e) => setUserForm((p) => ({ ...p, leave_balance: toNullableNumber(e.target.value) }))}
        required
      />
      <CustomInput label="Email" type="email" value={userForm.email} onChange={(e) => setUserForm((p) => ({ ...p, email: e.target.value }))} required />
      {includePassword ? (
        <CustomInput
          label="Password"
          type="password"
          value={userForm.password}
          onChange={(e) => setUserForm((p) => ({ ...p, password: e.target.value }))}
          required
        />
      ) : null}
      <CustomInput label="Mobile" value={userForm.mobile} onChange={(e) => setUserForm((p) => ({ ...p, mobile: e.target.value }))} required />
      <CustomInput label="Number" value={userForm.number} onChange={(e) => setUserForm((p) => ({ ...p, number: e.target.value }))} required />
      <CustomInput label="PAN" value={userForm.pan} onChange={(e) => setUserForm((p) => ({ ...p, pan: e.target.value }))} required />
      <CustomInput label="Aadhaar" value={userForm.aadhaar} onChange={(e) => setUserForm((p) => ({ ...p, aadhaar: e.target.value }))} required />
      <CustomInput
        label="Father Name"
        value={userForm.father_name}
        onChange={(e) => setUserForm((p) => ({ ...p, father_name: e.target.value }))}
        required
      />
      <CustomInput
        label="Mother Name"
        value={userForm.mother_name}
        onChange={(e) => setUserForm((p) => ({ ...p, mother_name: e.target.value }))}
        required
      />
      <CustomInput
        label="Current Address"
        value={userForm.current_address}
        onChange={(e) => setUserForm((p) => ({ ...p, current_address: e.target.value }))}
        required
      />
      <CustomInput
        label="Home Address"
        value={userForm.home_address}
        onChange={(e) => setUserForm((p) => ({ ...p, home_address: e.target.value }))}
        required
      />
      <CustomInput
        label="Business ID"
        type="number"
        value={userForm.business_id ?? ''}
        onChange={(e) => setUserForm((p) => ({ ...p, business_id: toNullableNumber(e.target.value) }))}
      />
    </div>
  )

  const nestedFields = () => (
    <>
      <Typography variant="subtitle1" className="!font-semibold">
        Bank Account
      </Typography>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <CustomInput
          label="Account Holder Name"
          value={bankAccountForm.account_holder_name}
          onChange={(e) => setBankAccountForm((p) => ({ ...p, account_holder_name: e.target.value }))}
          required
        />
        <CustomInput
          label="Account Number"
          value={bankAccountForm.account_number}
          onChange={(e) => setBankAccountForm((p) => ({ ...p, account_number: e.target.value }))}
          required
        />
        <CustomInput
          label="IFSC Code"
          value={bankAccountForm.ifsc_code}
          onChange={(e) => setBankAccountForm((p) => ({ ...p, ifsc_code: e.target.value }))}
          required
        />
        <CustomInput
          label="Bank Name"
          value={bankAccountForm.bank_name}
          onChange={(e) => setBankAccountForm((p) => ({ ...p, bank_name: e.target.value }))}
          required
        />
      </div>

      <Stack direction="row" justifyContent="space-between" alignItems="center" className="!pt-1">
        <Typography variant="subtitle1" className="!font-semibold">
          Educations
        </Typography>
        <Button
          type="button"
          variant="outlined"
          startIcon={<AddRoundedIcon />}
          onClick={() => {
            const next = educationCounter + 1
            setEducationCounter(next)
            setEducationForms((prev) => [...prev, createEducationForm(next)])
          }}
        >
          Add Education
        </Button>
      </Stack>

      {educationForms.map((education, index) => (
        <Card key={education.id} variant="outlined">
          <CardContent className="!pb-4">
            <Stack direction="row" justifyContent="space-between" alignItems="center" className="!mb-3">
              <Typography variant="subtitle2">Education #{index + 1}</Typography>
              <IconButton
                size="small"
                color="error"
                onClick={() => {
                  setEducationForms((prev) => prev.filter((item) => item.id !== education.id))
                  setEducationFilesByRowId((prev) => {
                    const next = { ...prev }
                    delete next[education.id]
                    return next
                  })
                  setReplacedEducationRowIds((prev) => prev.filter((id) => id !== education.id))
                }}
              >
                <DeleteRoundedIcon />
              </IconButton>
            </Stack>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <CustomInput
                label="Record Key"
                value={education.record_key}
                onChange={(e) =>
                  setEducationForms((prev) => prev.map((item) => (item.id === education.id ? { ...item, record_key: e.target.value } : item)))
                }
              />
              <CustomInput
                label="Degree"
                value={education.degree}
                onChange={(e) =>
                  setEducationForms((prev) => prev.map((item) => (item.id === education.id ? { ...item, degree: e.target.value } : item)))
                }
              />
              <CustomInput
                label="Institution"
                value={education.institution}
                onChange={(e) =>
                  setEducationForms((prev) => prev.map((item) => (item.id === education.id ? { ...item, institution: e.target.value } : item)))
                }
              />
              <CustomInput
                label="Year Of Passing"
                type="number"
                value={education.year_of_passing}
                onChange={(e) =>
                  setEducationForms((prev) => prev.map((item) => (item.id === education.id ? { ...item, year_of_passing: e.target.value } : item)))
                }
              />
              <CustomInput
                label="Percentage"
                type="number"
                value={education.percentage}
                onChange={(e) =>
                  setEducationForms((prev) => prev.map((item) => (item.id === education.id ? { ...item, percentage: e.target.value } : item)))
                }
              />
              <CustomInput
                label="Education Files"
                type="file"
                value={undefined}
                onChange={(event) =>
                  setEducationFilesByRowId((prev) => {
                    const files = getFilesFromInputEvent(event)
                    const nextFiles = files ? Array.from(files) : []
                    setReplacedEducationRowIds((current) =>
                      nextFiles.length > 0
                        ? current.includes(education.id)
                          ? current
                          : [...current, education.id]
                        : current.filter((id) => id !== education.id),
                    )
                    return {
                      ...prev,
                      [education.id]: nextFiles,
                    }
                  })
                }
                InputLabelProps={{ shrink: true }}
                inputProps={{ multiple: true }}
              />
              {(educationFilesByRowId[education.id] ?? []).length > 0 ? (
                <Alert
                  severity="success"
                  className="md:col-span-2"
                  action={
                    <IconButton
                      size="small"
                      onClick={() => {
                        setEducationFilesByRowId((prev) => ({ ...prev, [education.id]: [] }))
                        setReplacedEducationRowIds((prev) => prev.filter((id) => id !== education.id))
                      }}
                    >
                      <CloseRoundedIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  Selected: {(educationFilesByRowId[education.id] ?? []).length} file(s)
                </Alert>
              ) : null}
              {editingUser && education.source_id !== null && !replacedEducationRowIds.includes(education.id)
                ? (editingUser.educations?.find((item) => item.id === education.source_id)?.documents ?? [])
                    .filter((document) => !removedEducationDocumentIds.includes(document.id))
                    .map((document) => (
                      <InlineExistingFile
                        key={`edu-field-doc-${document.id}`}
                        userId={editingUser.id}
                        document={document}
                        onRemove={() =>
                          setRemovedEducationDocumentIds((prev) => (prev.includes(document.id) ? prev : [...prev, document.id]))
                        }
                      />
                    ))
                : null}
            </div>
          </CardContent>
        </Card>
      ))}

      <Stack direction="row" justifyContent="space-between" alignItems="center" className="!pt-1">
        <Typography variant="subtitle1" className="!font-semibold">
          Previous Companies
        </Typography>
        <Button
          type="button"
          variant="outlined"
          startIcon={<AddRoundedIcon />}
          onClick={() => {
            const next = companyCounter + 1
            setCompanyCounter(next)
            setPreviousCompanyForms((prev) => [...prev, createPreviousCompanyForm(next)])
          }}
        >
          Add Company
        </Button>
      </Stack>

      {previousCompanyForms.map((company, index) => (
        <Card key={company.id} variant="outlined">
          <CardContent className="!pb-4">
            <Stack direction="row" justifyContent="space-between" alignItems="center" className="!mb-3">
              <Typography variant="subtitle2">Company #{index + 1}</Typography>
              <IconButton
                size="small"
                color="error"
                onClick={() => {
                  setPreviousCompanyForms((prev) => prev.filter((item) => item.id !== company.id))
                  setCompanyFilesByRowId((prev) => {
                    const next = { ...prev }
                    delete next[company.id]
                    return next
                  })
                  setReplacedCompanyRowIds((prev) => prev.filter((id) => id !== company.id))
                }}
              >
                <DeleteRoundedIcon />
              </IconButton>
            </Stack>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <CustomInput
                label="Record Key"
                value={company.record_key}
                onChange={(e) =>
                  setPreviousCompanyForms((prev) => prev.map((item) => (item.id === company.id ? { ...item, record_key: e.target.value } : item)))
                }
              />
              <CustomInput
                label="Company Name"
                value={company.company_name}
                onChange={(e) =>
                  setPreviousCompanyForms((prev) => prev.map((item) => (item.id === company.id ? { ...item, company_name: e.target.value } : item)))
                }
              />
              <CustomInput
                label="Designation"
                value={company.designation}
                onChange={(e) =>
                  setPreviousCompanyForms((prev) => prev.map((item) => (item.id === company.id ? { ...item, designation: e.target.value } : item)))
                }
              />
              <CustomInput
                label="Start Date"
                type="date"
                value={company.start_date}
                onChange={(e) =>
                  setPreviousCompanyForms((prev) => prev.map((item) => (item.id === company.id ? { ...item, start_date: e.target.value } : item)))
                }
                InputLabelProps={{ shrink: true }}
              />
              <CustomInput
                label="End Date"
                type="date"
                value={company.end_date}
                onChange={(e) =>
                  setPreviousCompanyForms((prev) => prev.map((item) => (item.id === company.id ? { ...item, end_date: e.target.value } : item)))
                }
                InputLabelProps={{ shrink: true }}
              />
              <CustomInput
                label="Experience Proofs"
                type="file"
                value={undefined}
                onChange={(event) =>
                  setCompanyFilesByRowId((prev) => {
                    const files = getFilesFromInputEvent(event)
                    const nextFiles = files ? Array.from(files) : []
                    setReplacedCompanyRowIds((current) =>
                      nextFiles.length > 0
                        ? current.includes(company.id)
                          ? current
                          : [...current, company.id]
                        : current.filter((id) => id !== company.id),
                    )
                    return {
                      ...prev,
                      [company.id]: nextFiles,
                    }
                  })
                }
                InputLabelProps={{ shrink: true }}
                inputProps={{ multiple: true }}
              />
              {(companyFilesByRowId[company.id] ?? []).length > 0 ? (
                <Alert
                  severity="success"
                  className="md:col-span-2"
                  action={
                    <IconButton
                      size="small"
                      onClick={() => {
                        setCompanyFilesByRowId((prev) => ({ ...prev, [company.id]: [] }))
                        setReplacedCompanyRowIds((prev) => prev.filter((id) => id !== company.id))
                      }}
                    >
                      <CloseRoundedIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  Selected: {(companyFilesByRowId[company.id] ?? []).length} file(s)
                </Alert>
              ) : null}
              {editingUser && company.source_id !== null && !replacedCompanyRowIds.includes(company.id)
                ? (editingUser.previous_companies?.find((item) => item.id === company.source_id)?.documents ?? [])
                    .filter((document) => !removedCompanyDocumentIds.includes(document.id))
                    .map((document) => (
                      <InlineExistingFile
                        key={`cmp-field-doc-${document.id}`}
                        userId={editingUser.id}
                        document={document}
                        onRemove={() => setRemovedCompanyDocumentIds((prev) => (prev.includes(document.id) ? prev : [...prev, document.id]))}
                      />
                    ))
                : null}
            </div>
          </CardContent>
        </Card>
      ))}

      <Typography variant="subtitle1" className="!font-semibold !pt-1">
        General Documents
      </Typography>
      {editingUser && remainingGeneralDocuments.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {remainingGeneralDocuments.map((document) => (
            <DocumentCard key={`edit-doc-${document.id}`} userId={editingUser.id} document={document} />
          ))}
        </div>
      ) : null}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {GENERAL_DOCUMENT_FIELD_CONFIG.map((field) => (
          <Stack key={field.key} spacing={1}>
            <CustomInput
              label={field.label}
              type="file"
              value={undefined}
              onChange={(event) => onGeneralFileChange(field.key, getFilesFromInputEvent(event)?.[0] ?? null)}
              InputLabelProps={{ shrink: true }}
              inputProps={field.accept ? { accept: field.accept } : undefined}
            />
            {selectedGeneralFileByField[field.key] ? (
              <Alert
                severity="success"
                action={
                  <IconButton size="small" onClick={() => onGeneralFileChange(field.key, null)}>
                    <CloseRoundedIcon fontSize="small" />
                  </IconButton>
                }
              >
                Selected: {selectedGeneralFileByField[field.key]?.name}
              </Alert>
            ) : null}
            {!selectedGeneralFileByField[field.key] && existingGeneralDocumentByField[field.key] ? (
              <Alert
                severity="info"
                action={
                  <IconButton size="small" onClick={() => onRemoveExistingGeneralDocument(field.key)}>
                    <CloseRoundedIcon fontSize="small" />
                  </IconButton>
                }
              >
                Existing: {existingGeneralDocumentByField[field.key]?.original_filename}
              </Alert>
            ) : null}
          </Stack>
        ))}
      </div>

    </>
  )

  const selectedEducationDocs =
    selectedUser?.educations?.flatMap((education, index) =>
      education.documents.map((document) => ({
        document,
        label: `Education ${index + 1}: ${education.degree || education.institution || 'Record'}`,
      })),
    ) ?? []

  const selectedCompanyDocs =
    selectedUser?.previous_companies?.flatMap((company, index) =>
      company.documents.map((document) => ({
        document,
        label: `Company ${index + 1}: ${company.company_name || company.designation || 'Record'}`,
      })),
    ) ?? []

  if (loadingUsers && users.length === 0) {
    return <CustomLoader fullscreen label="Loading users..." />
  }

  return (
    <div className="space-y-4">
      <Card className="!rounded-2xl">
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1.5}>
            <Typography variant="h5" className="!font-semibold">
              User List
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setCreateOpen(true)}>
                Create User
              </Button>
              <Button variant="outlined" startIcon={<RefreshRoundedIcon />} onClick={() => void loadUsers()} disabled={loadingUsers}>
                {loadingUsers ? <CustomLoader size={16} color="inherit" /> : 'Refresh'}
              </Button>
            </Stack>
          </Stack>

          <Box component="form" onSubmit={onFilterSubmit} className="!mt-4 grid grid-cols-1 gap-3 md:grid-cols-5">
            <CustomInput
              label="Filter First Name"
              value={filterDraft.first_name ?? ''}
              onChange={(event) => setFilterDraft((prev) => ({ ...prev, first_name: event.target.value }))}
              placeholder="Shivam Kumar"
            />
            <CustomInput
              label="Filter Mobile"
              value={filterDraft.mobile_number ?? ''}
              onChange={(event) => setFilterDraft((prev) => ({ ...prev, mobile_number: event.target.value }))}
              placeholder="6201763368"
            />
            <CustomAutocomplete
              label="Filter Branch"
              options={branchOptions}
              value={filterDraft.branch_id ?? null}
              onChange={(nextValue) => setFilterDraft((prev) => ({ ...prev, branch_id: nextValue }))}
              placeholder="Select branch"
            />
            <Stack direction="row" spacing={1} alignItems="end" className="md:col-span-2">
              <Button type="submit" variant="contained" className="!h-[44px]">
                Apply
              </Button>
              <Button type="button" variant="outlined" onClick={onResetFilters} className="!h-[44px]">
                Reset
              </Button>
            </Stack>
          </Box>

          {userError ? (
            <Alert severity="error" className="!mt-3">
              {userError}
            </Alert>
          ) : null}

          <CustomTable
            columns={userColumns}
            rows={users}
            rowKey={(user) => user.id}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={setPage}
            onRowsPerPageChange={(nextRowsPerPage) => {
              setRowsPerPage(nextRowsPerPage)
              setPage(1)
            }}
            emptyMessage="No users found."
            loading={loadingUsers}
            totalRows={totalUsers}
            paginateRows={false}
            renderRow={(user) => (
              <>
                <TableCell>{user.id}</TableCell>
                <TableCell>{user.username || '-'}</TableCell>
                <TableCell>{user.email || '-'}</TableCell>
                <TableCell>{user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || '-'}</TableCell>
                <TableCell>{user.role || '-'}</TableCell>
                <TableCell>{user.status || '-'}</TableCell>
                <TableCell align="right">
                  <Tooltip title="View">
                    <IconButton
                      onClick={() => {
                        setSelectedUser(user)
                        setViewOpen(true)
                      }}
                    >
                      <VisibilityRoundedIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit">
                    <IconButton onClick={() => onEditUser(user)}>
                      <EditRoundedIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton color="error" onClick={() => void onDeleteUser(user)}>
                      <DeleteRoundedIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </>
            )}
          />
        </CardContent>
      </Card>

      <Dialog open={createOpen} onClose={closeCreateModal} fullWidth maxWidth="md">
        <DialogTitle>Create User</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={onCreateSubmit} className="space-y-4 pt-1">
            {loadingFormOptions ? <CustomLoader label="Loading branches and roles..." /> : null}
            {userFormFields(true)}
            {nestedFields()}
            <Stack direction="row" justifyContent="flex-end" spacing={1}>
              <Button variant="outlined" onClick={closeCreateModal}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={submittingUser}>
                {submittingUser ? <CustomLoader size={18} color="inherit" /> : 'Create'}
              </Button>
            </Stack>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onClose={closeEditModal} fullWidth maxWidth="md">
        <DialogTitle>Update User #{editingUserId}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={onEditSubmit} className="space-y-4 pt-1">
            {loadingFormOptions ? <CustomLoader label="Loading branches and roles..." /> : null}
            {userFormFields(false)}
            {nestedFields()}
            <Stack direction="row" justifyContent="flex-end" spacing={1}>
              <Button variant="outlined" onClick={closeEditModal}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={submittingUser}>
                {submittingUser ? <CustomLoader size={18} color="inherit" /> : 'Update'}
              </Button>
            </Stack>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>User Detail</DialogTitle>
        <DialogContent>
          {selectedUser ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <Typography variant="body2">
                  <strong>Name:</strong> {selectedUser.name || '-'}
                </Typography>
                <Typography variant="body2">
                  <strong>Email:</strong> {selectedUser.email || '-'}
                </Typography>
                <Typography variant="body2">
                  <strong>Role:</strong> {selectedUser.role || '-'}
                </Typography>
                <Typography variant="body2">
                  <strong>Status:</strong> {selectedUser.status || '-'}
                </Typography>
              </div>

              <Typography variant="subtitle1" className="!font-semibold">
                General Documents
              </Typography>
              {selectedUser.documents && selectedUser.documents.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {selectedUser.documents.map((document) => (
                    <DocumentCard key={`doc-${document.id}`} userId={selectedUser.id} document={document} />
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
              {selectedEducationDocs.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {selectedEducationDocs.map(({ document, label }) => (
                    <DocumentCard key={`edu-doc-${document.id}`} userId={selectedUser.id} document={document} label={label} />
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
              {selectedCompanyDocs.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {selectedCompanyDocs.map(({ document, label }) => (
                    <DocumentCard key={`cmp-doc-${document.id}`} userId={selectedUser.id} document={document} label={label} />
                  ))}
                </div>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No experience documents.
                </Typography>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default UsersPage
