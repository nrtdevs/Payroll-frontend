import { useId, useMemo, useState } from 'react'
import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import FormLabel from '@mui/material/FormLabel'
import TextField from '@mui/material/TextField'

export type CustomAutocompleteOption<T> = {
  label: string
  value: T
}

type CustomAutocompleteProps<T> = {
  label?: string
  options: CustomAutocompleteOption<T>[]
  value: T | null
  onChange: (value: T | null, option: CustomAutocompleteOption<T> | null) => void
  required?: boolean
  requiredMessage?: string
  helperText?: string
  placeholder?: string
  disabled?: boolean
  size?: 'small' | 'medium'
  inputHeight?: number | string
  fullWidth?: boolean
  noOptionsText?: string
}

function CustomAutocomplete<T>({
  label,
  options,
  value,
  onChange,
  required,
  requiredMessage,
  helperText,
  placeholder,
  disabled,
  size = 'small',
  inputHeight = 44,
  fullWidth = true,
  noOptionsText = 'No options',
}: CustomAutocompleteProps<T>) {
  const generatedId = useId()
  const fieldId = `${generatedId}-autocomplete`
  const hasLabel = label !== undefined && label !== null && label !== ''
  const [touched, setTouched] = useState(false)

  const selectedOption = useMemo(() => options.find((option) => option.value === value) ?? null, [options, value])

  const validationError = useMemo(() => {
    if (!required) return undefined
    if (selectedOption !== null) return undefined
    if (requiredMessage) return requiredMessage
    return typeof label === 'string' ? `${label} is required.` : 'This field is required.'
  }, [required, selectedOption, requiredMessage, label])

  const showError = touched && Boolean(validationError)

  return (
    <Box>
      {hasLabel ? (
        <FormLabel htmlFor={fieldId} required={required} className="!mb-1 !block !text-sm !font-medium !text-slate-700">
          {label}
        </FormLabel>
      ) : null}
      <Autocomplete
        id={fieldId}
        options={options}
        value={selectedOption}
        noOptionsText={noOptionsText}
        fullWidth={fullWidth}
        disabled={disabled}
        isOptionEqualToValue={(option, currentValue) => option.value === currentValue.value}
        onChange={(_, option) => onChange(option?.value ?? null, option)}
        onBlur={() => setTouched(true)}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={placeholder}
            size={size}
            error={showError}
            helperText={showError ? validationError : helperText}
            sx={{
              '& .MuiInputBase-root': {
                height: inputHeight,
              },
            }}
          />
        )}
      />
    </Box>
  )
}

export default CustomAutocomplete
