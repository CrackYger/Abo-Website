export const EUR = (n) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n)
export const fmtDate = (d) => new Date(d).toLocaleDateString('de-DE')
export const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
