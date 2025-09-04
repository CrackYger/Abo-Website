const KEY = 'gianni_abos_v1'
export const loadSubs = () => {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}
export const saveSubs = (arr) => { localStorage.setItem(KEY, JSON.stringify(arr || [])) }
