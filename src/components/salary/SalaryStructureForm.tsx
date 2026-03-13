import { Button, Checkbox, MenuItem, Stack, Typography } from '@mui/material'
import type { ChangeEvent } from 'react'
import type { SalaryComponent, SalaryStructurePayload } from '../../types/salaryTypes'
import CustomInput from '../CustomInput'
import CustomLoader from '../CustomLoader'

type SalaryStructureFormProps = {
  value: SalaryStructurePayload
  components: SalaryComponent[]
  onChange: (next: SalaryStructurePayload) => void
  onSubmit: () => void
  onCancel: () => void
  submitting: boolean
  submitLabel: string
  formError?: string
}

function SalaryStructureForm({
  value,
  components,
  onChange,
  onSubmit,
  onCancel,
  submitting,
  submitLabel,
  formError,
}: SalaryStructureFormProps) {
  const componentNameMap = new Map(components.map((component) => [component.id, component.name]))

  const onChangeComponents = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const selected = event.target.value
    const rawValues = Array.isArray(selected) ? selected : [selected]
    const componentIds = rawValues
      .map((item) => Number(item))
      .filter((item) => Number.isFinite(item) && item > 0)

    onChange({
      ...value,
      component_ids: Array.from(new Set(componentIds)),
    })
  }

  return (
    <form
      className="grid gap-3 pt-1"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
    >
      <CustomInput label="Structure Name" value={value.name} onChange={(event) => onChange({ ...value, name: event.target.value })} required />

      <CustomInput
        label="Components"
        select
        required
        SelectProps={{
          multiple: true,
          displayEmpty: true,
          renderValue: (selected) => {
            const selectedIds = Array.isArray(selected) ? selected.map((item) => Number(item)) : []
            if (selectedIds.length === 0) return 'Select components'
            return selectedIds.map((id) => componentNameMap.get(id) ?? `Component #${id}`).join(', ')
          },
        }}
        value={value.component_ids}
        onChange={onChangeComponents}
      >
        {components.length === 0 ? (
          <MenuItem disabled value="">
            No components available
          </MenuItem>
        ) : null}

        {components.map((component) => {
          const checked = value.component_ids.includes(component.id)
          return (
            <MenuItem key={component.id} value={component.id}>
              <Checkbox checked={checked} size="small" />
              {component.name} ({component.type})
            </MenuItem>
          )
        })}
      </CustomInput>

      {formError ? <Typography color="error">{formError}</Typography> : null}

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

export default SalaryStructureForm
