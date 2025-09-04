import { validateSubsList } from '../lib/schema.js'
export function safeImportFromText(text, setSubs){
  try {
    const data = JSON.parse(text)
    const res = validateSubsList(data)
    if (!res.ok) {
      alert('Import abgebrochen:\n' + res.errors.slice(0,5).join('\n'))
      return false
    }
    setSubs(data)
    return true
  } catch(e){
    alert('JSON-Fehler: ' + e.message)
    return false
  }
}
