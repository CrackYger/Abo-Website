import { describe, it, expect } from 'vitest'
import { validateSubsList } from '../src/lib/schema.js'

describe('schema', () => {
  it('rejects non-array', () => {
    const r = validateSubsList({})
    expect(r.ok).toBe(false)
  })
  it('accepts minimal valid list', () => {
    const arr = [{
      id:'x', plan:'Spotify Only', price:7.99, status:'angefragt', createdAt: new Date().toISOString(), email:'a@b.de'
    }]
    const r = validateSubsList(arr)
    expect(r.ok).toBe(true)
  })
})
