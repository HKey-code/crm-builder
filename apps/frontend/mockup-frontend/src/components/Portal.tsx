import { createPortal } from 'react-dom'
import * as React from 'react'

export function Portal({ children }: { children: React.ReactNode }) {
  const [el, setEl] = React.useState<HTMLElement | null>(null)
  React.useEffect(() => setEl(document.body), [])
  return el ? createPortal(children, el) : null
}

export default Portal


