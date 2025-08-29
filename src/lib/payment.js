import { EUR, fmtDate } from './utils.js'
export function labelPayment(p){ return p === 'cash' ? 'Barzahlung' : 'Überweisung' }
export function calcNextBilling(startISO, yearly){
  const d = new Date(startISO)
  if (yearly) d.setFullYear(d.getFullYear() + 1)
  else d.setMonth(d.getMonth() + 1)
  return d.toISOString()
}
export function buildInquiryMailBody({ id, planName, yearly, price, form, comingSoon = false }){
  const lines = [
    `Plan: ${planName} (${yearly ? 'jährlich' : 'monatlich'})`,
    comingSoon ? 'Status: Vormerkung (kommt bald)' : '',
    `Preis: ${EUR(price)} / Monat`,
    `Name: ${form.name}`,
    `E‑Mail: ${form.email}`,
    form.phone ? `Telefon/WhatsApp: ${form.phone}` : '',
    form.address ? `Adresse: ${form.address}` : '',
    `Zahlungsart: ${labelPayment(form.payment)}`,
    `Startdatum: ${fmtDate(form.startDate)}`,
    form.notes ? `Hinweise: ${form.notes}` : '',
    '—',
    `ID: ${id}`,
    `Erstellt: ${new Date().toLocaleString('de-DE')}`,
  ].filter(Boolean)
  return lines.join(' ')
}
export { EUR, fmtDate }
