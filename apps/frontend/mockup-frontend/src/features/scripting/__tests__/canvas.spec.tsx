import { render, screen } from '@testing-library/react'
import ScriptCanvas from '../../features/scripting/components/ScriptCanvas'

it('renders a flow canvas controls', () => {
  render(<div style={{ height: 600 }}><ScriptCanvas /></div>)
  // Controls have buttons with aria-labels in RF
  // This assertion is minimal smoke to ensure mount succeeds
  expect(document.querySelector('.react-flow')).toBeTruthy()
})


