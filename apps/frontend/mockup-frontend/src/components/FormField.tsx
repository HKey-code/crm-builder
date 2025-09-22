import React from 'react'

type BaseProps = {
  label: string
  id: string
  required?: boolean
  children?: never
}

type InputProps = BaseProps & React.InputHTMLAttributes<HTMLInputElement> & { type?: 'text' | 'file' }
type SelectProps = BaseProps & React.SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string }[] }

export const TextField: React.FC<InputProps> = ({ label, id, required, type = 'text', ...rest }) => (
  <label htmlFor={id} className="block text-sm text-lpc-text">
    <span className="mb-1 inline-block">{label}{required && <span className="text-red-600">*</span>}</span>
    <input
      id={id}
      type={type}
      required={required}
      className="mt-1 w-full rounded border px-3 py-2 focus:border-lpc-secondary focus:outline-none focus:ring-2 focus:ring-lpc-secondary"
      {...rest}
    />
  </label>
)

export const SelectField: React.FC<SelectProps> = ({ label, id, required, options, ...rest }) => (
  <label htmlFor={id} className="block text-sm text-lpc-text">
    <span className="mb-1 inline-block">{label}{required && <span className="text-red-600">*</span>}</span>
    <select id={id} required={required} className="mt-1 w-full rounded border px-3 py-2 focus:border-lpc-secondary focus:outline-none focus:ring-2 focus:ring-lpc-secondary" {...rest}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  </label>
)


