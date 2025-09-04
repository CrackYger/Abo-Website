export const labelPayment = (p) => p === 'bank' ? 'Überweisung' : p === 'cash' ? 'Barzahlung' : p
export function calcNextBilling(startIso, yearly=false){
  const d = new Date(startIso || Date.now())
  if (yearly) d.setFullYear(d.getFullYear()+1)
  else d.setMonth(d.getMonth()+1)
  return d.toISOString()
}
export function buildInquiryMailBody({ id, planName, yearly, price, form, comingSoon }){
  return `Hallo Gianni,\n\n${comingSoon ? 'ich möchte vorgemerkt werden' : 'ich möchte ein Abo anfragen'}:\n` +
    `Plan: ${planName} (${yearly ? 'jährlich' : 'monatlich'})\n` +
    `Preis: ${price} EUR / Monat\n` +
    `Name: ${form.name}\nE-Mail: ${form.email}\nTelefon: ${form.phone || '-'}\n` +
    `Adresse: ${form.address || '-'}\nHinweise: ${form.notes || '-'}\n` +
    `${comingSoon ? 'Wunschtermin' : 'Start'}: ${form.startDate}\n\nAbo-ID: ${id}\n`
}
