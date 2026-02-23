import { useId, useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import FormLabel from '@mui/material/FormLabel'
import TextField from '@mui/material/TextField'
import type { TextFieldProps } from '@mui/material/TextField'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type CustomInputProps = Omit<TextFieldProps, 'error'> & {
  requiredMessage?: string
  invalidMessage?: string
  validator?: (value: string) => string | undefined
  inputHeight?: number | string
}

const toStringValue = (value: unknown): string => {
  if (Array.isArray(value)) return value.join(',')
  if (value === undefined || value === null) return ''
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  return String(value)
}

function CustomInput({
  requiredMessage,
  invalidMessage,
  validator,
  inputHeight,
  helperText,
  onBlur,
  onChange,
  required,
  type,
  value,
  label,
  sx,
  size = 'small',
  fullWidth = true,
  multiline,
  ...rest
}: CustomInputProps) {
  const generatedId = useId()
  const fieldId = rest.id ?? generatedId
  const hasLabel = label !== undefined && label !== null && label !== ''
  const [touched, setTouched] = useState(false)
  const textValue = toStringValue(value)

  const validationError = useMemo(() => {
    if (required && textValue.trim() === '') {
      if (requiredMessage) return requiredMessage
      return typeof label === 'string' ? `${label} is required.` : 'This field is required.'
    }

    if (textValue.trim() !== '' && type === 'email' && !emailPattern.test(textValue)) {
      return invalidMessage ?? 'Please enter a valid email address.'
    }

    if (textValue.trim() !== '' && type === 'number' && Number.isNaN(Number(textValue))) {
      return invalidMessage ?? 'Please enter a valid number.'
    }

    if (validator) {
      return validator(textValue)
    }

    return undefined
  }, [required, textValue, type, invalidMessage, validator, label, requiredMessage])

  const showError = touched && Boolean(validationError)

  return (
    <Box>
      {hasLabel ? (
        <FormLabel
          htmlFor={fieldId}
          required={required}
          sx={{ mb: 1, display: 'block', fontSize: 14, fontWeight: 600, color: 'text.secondary' }}
        >
          {label}
        </FormLabel>
      ) : null}
      <TextField
        {...rest}
        id={fieldId}
        value={value}
        type={type}
        size={size}
        fullWidth={fullWidth}
        required={required}
        multiline={multiline}
        error={showError}
        helperText={showError ? validationError : helperText}
        onBlur={(event) => {
          setTouched(true)
          onBlur?.(event)
        }}
        onChange={(event) => {
          onChange?.(event)
        }}
        sx={[
          !multiline && (inputHeight ?? 44)
            ? {
                '& .MuiInputBase-root': {
                  height: inputHeight ?? 44,
                },
              }
            : undefined,
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      />
    </Box>
  )
}

export default CustomInput
