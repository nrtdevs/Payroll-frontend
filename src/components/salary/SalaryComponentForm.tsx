import { Button, MenuItem, Stack } from '@mui/material'
import type { SalaryComponentPayload } from '../../types/salaryTypes'
import CustomInput from '../CustomInput'
import CustomLoader from '../CustomLoader'

type SalaryComponentFormProps = {
  value: SalaryComponentPayload
  onChange: (next: SalaryComponentPayload) => void
  onSubmit: () => void
  onCancel: () => void
  submitting: boolean
  submitLabel: string
}

function SalaryComponentForm({ value, onChange, onSubmit, onCancel, submitting, submitLabel }: SalaryComponentFormProps) {
  return (
    <form
      className="grid gap-3 pt-1"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
    >
      <CustomInput
        label="Name"
        value={value.name}
        onChange={(event) => onChange({ ...value, name: event.target.value })}
        required
        placeholder="Basic"
      />
      <CustomInput
        label="Type"
        select
        value={value.type}
        onChange={(event) => onChange({ ...value, type: event.target.value as SalaryComponentPayload['type'] })}
        required
      >
        <MenuItem value="EARNING">EARNING</MenuItem>
        <MenuItem value="DEDUCTION">DEDUCTION</MenuItem>
      </CustomInput>
      <Stack direction="row" spacing={1} justifyContent="flex-end">
        <Button type="button" variant="outlined" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={submitting}>
          {submitting ? <CustomLoader size={18} color="inherit" /> : submitLabel}
        </Button>
      </Stack>
    </form>
  )
}

export default SalaryComponentForm
