export const EUR = (n) => new Intl.NumberFormat('de-DE', { style:'currency', currency:'EUR' }).format(n)
export const fmtDate = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('de-DE', { year:'numeric', month:'long', day:'2-digit' })
}
export const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36)
