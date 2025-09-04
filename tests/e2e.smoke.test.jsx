import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import App from '../src/App.jsx'

// helper
const clickByText = (text) => {
  const el = screen.getByText((t)=>t.trim()===text)
  fireEvent.click(el)
}

describe('E2E smoke', () => {
  it('can register, open wizard, and place an inquiry (mailto opened) ', async () => {
    // Spy on window.open so mailto doesn't crash
    const openSpy = vi.spyOn(window, 'open').mockImplementation(()=>{})

    render(<App />)

    // Open account dialog
    clickByText('Konto')
    clickByText('Neu hier? Registrieren')

    // Fill fields
    const email = screen.getByLabelText('E-Mail')
    const pw = screen.getByLabelText('Passwort')
    const pw2 = screen.getByLabelText('Passwort wiederholen')
    fireEvent.change(email, { target: { value: 'smoke@test.de' } })
    fireEvent.change(pw, { target: { value: 'secret1' } })
    fireEvent.change(pw2, { target: { value: 'secret1' } })

    clickByText('Registrieren')

    // Profile view visible
    await screen.findByText('Mein Konto')

    // Close dialog
    fireEvent.click(screen.getByText('✕'))

    // Start first plan wizard
    clickByText('Abo auswählen')

    // Go through wizard steps
    clickByText('Weiter')
    clickByText('Weiter')
    // Final submit
    const finalBtn = screen.getByText((t)=>t.includes('Abo anfragen'))
    fireEvent.click(finalBtn)

    // Ensure mailto opened
    expect(openSpy).toHaveBeenCalled()
    const url = openSpy.mock.calls[0]?.[0] || ''
    expect(url.startsWith('mailto:')).toBe(true)

    // localStorage contains our subs list
    const raw = window.localStorage.getItem('gianni_abos_v1') || '[]'
    const arr = JSON.parse(raw)
    expect(Array.isArray(arr) && arr.length >= 1).toBe(true)

    openSpy.mockRestore()
  }, 20000)
})
