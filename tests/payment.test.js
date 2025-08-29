import { describe, it, expect } from 'vitest'
import { labelPayment, calcNextBilling, buildInquiryMailBody, EUR } from '../src/lib/payment.js'

describe('payment helpers', () => {
  it('labelPayment', () => {
    expect(labelPayment('bank')).toBe('Überweisung')
    expect(labelPayment('cash')).toBe('Barzahlung')
  })
  it('calcNextBilling monthly/yearly', () => {
    const m = calcNextBilling('2025-01-31', false)
    expect(typeof m).toBe('string')
    const y = calcNextBilling('2025-01-01', true)
    expect(new Date(y).getFullYear()).toBe(2026)
  })
  it('buildInquiryMailBody has fields and no newlines', () => {
    const body = buildInquiryMailBody({
      id: 't',
      planName: 'Spotify Only',
      yearly: false,
      price: 7.99,
      form: { name: 'T', email: 't@t', payment: 'bank', startDate: '2025-01-01' }
    })
    expect(body).toContain('Plan:')
    expect(body).toContain('ID:')
    expect(/\n/.test(body)).toBe(false)
  })
})
