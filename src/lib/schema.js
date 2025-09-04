// Minimal JSON schema-like check for subscription list
// We keep it dependency-free.
export function validateSubsList(value) {
  const errors = []
  if (!Array.isArray(value)) {
    errors.push('Root ist kein Array.')
    return { ok: false, errors }
  }
  value.forEach((s, idx) => {
    if (typeof s !== 'object' || s == null) { errors.push(`#${idx}: kein Objekt`); return }
    const required = ['id','plan','price','status','createdAt','email']
    for (const k of required) {
      if (!(k in s)) errors.push(`#${idx}: Feld fehlt: ${k}`)
    }
    if (s.plan && typeof s.plan !== 'string') errors.push(`#${idx}: plan muss string sein`)
    if (s.price && typeof s.price !== 'number') errors.push(`#${idx}: price muss number sein`)
    if (s.status && !['angefragt','aktiv','pausiert','gekündigt','vormerkung'].includes(s.status)) errors.push(`#${idx}: unerlaubter status`)
    if (s.email && !/^([^@\s]+)@([^@\s]+)\.[^@\s]+$/.test(s.email)) errors.push(`#${idx}: email ungültig`)
  })
  return { ok: errors.length === 0, errors }
}
