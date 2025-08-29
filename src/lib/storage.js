const STORAGE_KEY = 'gianni_abos_v1'
export function loadSubs(){
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}
export function saveSubs(list){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}
