import { useEffect, useMemo, useState } from 'react'
import { Alert, Avatar, Button, Card, CardContent, Divider, Stack, Typography } from '@mui/material'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import UploadRoundedIcon from '@mui/icons-material/UploadRounded'
import SaveRoundedIcon from '@mui/icons-material/SaveRounded'
import DomainRoundedIcon from '@mui/icons-material/DomainRounded'
import CustomInput from '../components/CustomInput'
import CustomLoader from '../components/CustomLoader'
import useToast from '../context/useToast'
import { API_URL } from '../config/env'
import { companyService, type CompanyProfilePayload } from '../services/companyService'

function CompanyPage() {
  const { showToast } = useToast()
  const [form, setForm] = useState<CompanyProfilePayload>(companyService.emptyCompany())
  const [logoUrl, setLogoUrl] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const company = await companyService.getCompany()
      setForm({
        company_name: company.company_name,
        legal_name: company.legal_name,
        pan_number: company.pan_number,
        tan_number: company.tan_number,
        gst_number: company.gst_number,
        pf_number: company.pf_number,
        esi_number: company.esi_number,
        email: company.email,
        phone: company.phone,
        website: company.website,
        address_line1: company.address_line1,
        address_line2: company.address_line2,
        city: company.city,
        state: company.state,
        country: company.country,
        pincode: company.pincode,
      })
      setLogoUrl(company.logo_url || '')
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Failed to load company profile.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const previewLogoUrl = useMemo(() => {
    if (!logoUrl) return ''
    if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://') || logoUrl.startsWith('data:')) return logoUrl
    if (logoUrl.startsWith('/')) return `${API_URL}${logoUrl}`
    return `${API_URL}/${logoUrl}`
  }, [logoUrl])

  const onSave = async () => {
    setSaving(true)
    setError('')
    try {
      const response = await companyService.upsertCompany(form)
      setLogoUrl(response.logo_url || logoUrl)
      showToast('Company profile saved successfully.', 'success')
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Failed to save company profile.'
      setError(message)
      showToast(message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const onUploadLogo = async () => {
    if (!selectedFile) {
      setError('Please choose a logo file first.')
      return
    }
    setUploading(true)
    setError('')
    try {
      const response = await companyService.uploadCompanyLogo(selectedFile)
      setLogoUrl(response.logo_url || '')
      setSelectedFile(null)
      showToast('Company logo uploaded successfully.', 'success')
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Failed to upload logo.'
      setError(message)
      showToast(message, 'error')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return <CustomLoader fullscreen label="Loading company profile..." />
  }

  return (
    <Card className="!rounded-2xl">
      <CardContent>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1.5}>
          <div>
            <Typography variant="h5" className="!font-semibold">
              Company Profile
            </Typography>
            <Typography variant="body2" color="text.secondary" className="!mt-1">
              Configure organization details used in payroll documents and salary slips.
            </Typography>
          </div>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<RefreshRoundedIcon />} onClick={() => void loadData()}>
              Refresh
            </Button>
            <Button variant="contained" startIcon={<SaveRoundedIcon />} onClick={() => void onSave()} disabled={saving}>
              {saving ? <CustomLoader size={16} color="inherit" /> : 'Save'}
            </Button>
          </Stack>
        </Stack>

        {error ? (
          <Alert severity="error" className="!mt-3">
            {error}
          </Alert>
        ) : null}

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <CustomInput label="Company Name" value={form.company_name} onChange={(event) => setForm((prev) => ({ ...prev, company_name: event.target.value }))} required />
              <CustomInput label="Legal Name" value={form.legal_name} onChange={(event) => setForm((prev) => ({ ...prev, legal_name: event.target.value }))} />
              <CustomInput label="PAN Number" value={form.pan_number} onChange={(event) => setForm((prev) => ({ ...prev, pan_number: event.target.value }))} />
              <CustomInput label="TAN Number" value={form.tan_number} onChange={(event) => setForm((prev) => ({ ...prev, tan_number: event.target.value }))} />
              <CustomInput label="GST Number" value={form.gst_number} onChange={(event) => setForm((prev) => ({ ...prev, gst_number: event.target.value }))} />
              <CustomInput label="PF Number" value={form.pf_number} onChange={(event) => setForm((prev) => ({ ...prev, pf_number: event.target.value }))} />
              <CustomInput label="ESI Number" value={form.esi_number} onChange={(event) => setForm((prev) => ({ ...prev, esi_number: event.target.value }))} />
              <CustomInput label="Email" type="email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} />
              <CustomInput label="Phone" value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} />
              <CustomInput label="Website" value={form.website} onChange={(event) => setForm((prev) => ({ ...prev, website: event.target.value }))} />
            </div>

            <Divider />

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <CustomInput label="Address Line 1" value={form.address_line1} onChange={(event) => setForm((prev) => ({ ...prev, address_line1: event.target.value }))} />
              <CustomInput label="Address Line 2" value={form.address_line2} onChange={(event) => setForm((prev) => ({ ...prev, address_line2: event.target.value }))} />
              <CustomInput label="City" value={form.city} onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))} />
              <CustomInput label="State" value={form.state} onChange={(event) => setForm((prev) => ({ ...prev, state: event.target.value }))} />
              <CustomInput label="Country" value={form.country} onChange={(event) => setForm((prev) => ({ ...prev, country: event.target.value }))} />
              <CustomInput label="Pincode" value={form.pincode} onChange={(event) => setForm((prev) => ({ ...prev, pincode: event.target.value }))} />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
            <Typography variant="subtitle1" className="!font-semibold">
              Company Logo
            </Typography>
            <Typography variant="body2" color="text.secondary" className="!mt-1">
              Upload logo for salary slip PDF header.
            </Typography>

            <Stack alignItems="center" className="!mt-4" spacing={1.5}>
              <Avatar
                variant="rounded"
                src={previewLogoUrl || undefined}
                sx={{ width: 112, height: 112, bgcolor: 'rgba(15,23,42,0.08)', color: 'text.secondary' }}
              >
                {!previewLogoUrl ? <DomainRoundedIcon /> : null}
              </Avatar>

              <Button component="label" variant="outlined" fullWidth>
                Choose Logo
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null
                    setSelectedFile(file)
                  }}
                />
              </Button>

              <Typography variant="caption" color="text.secondary">
                {selectedFile ? selectedFile.name : 'PNG / JPG / SVG'}
              </Typography>

              <Button
                fullWidth
                variant="contained"
                startIcon={<UploadRoundedIcon />}
                onClick={() => void onUploadLogo()}
                disabled={!selectedFile || uploading}
              >
                {uploading ? <CustomLoader size={16} color="inherit" /> : 'Upload Logo'}
              </Button>
            </Stack>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default CompanyPage

