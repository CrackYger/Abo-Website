export const USERS_KEY = 'gianni_users_v1'
export const SESSION_KEY = 'gianni_session_v1'

export function loadUsers(){
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]') } catch { return [] }
}
export function saveUsers(list){ localStorage.setItem(USERS_KEY, JSON.stringify(list)) }
export function saveSession(userId){ localStorage.setItem(SESSION_KEY, JSON.stringify({ userId })) }
export function loadSession(){
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || '{}') } catch { return {} }
}
export function clearSession(){ localStorage.removeItem(SESSION_KEY) }

export function makeSalt(){ return Math.random().toString(36).slice(2,10) }
export async function sha256Hex(str){
  const enc = new TextEncoder().encode(str)
  const buf = await crypto.subtle.digest('SHA-256', enc)
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}
