const KEY = 'gianni_users_v1'
const CUR = 'gianni_current_user_v1'

function parseUsers(){
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}
function saveUsers(users){ localStorage.setItem(KEY, JSON.stringify(users || [])) }

function computeHashes(password, salt=''){
  // toy hash (demo only)
  const s = salt + ':' + String(password ?? '')
  let h = 0
  for (let i=0;i<s.length;i++) h = Math.imul(31, h) + s.charCodeAt(i) | 0
  const hex = (h>>>0).toString(16)
  const pair = hex + ':' + salt
  const b64 = btoa(pair)
  return { hex, pair, b64 }
}
function makeSalt(){ return Math.random().toString(36).slice(2,10) }

function normalizeUsers(users){
  let changed = false
  const out = users.map(u => {
    if (!u || typeof u !== 'object') return u
    const stored = typeof u.pass === 'string' ? u.pass : ''
    // already proper base64?
    try {
      const dec = atob(stored)
      if (dec.includes(':')) return u
    } catch {}
    // legacy "hex:salt" becomes base64
    if (stored && typeof stored === 'string' && stored.indexOf(':') !== -1){
      changed = true
      return { ...u, pass: btoa(stored) }
    }
    // legacy "hex" only → wrap with empty salt
    if (stored && typeof stored === 'string' && stored.indexOf(':') === -1){
      changed = true
      return { ...u, pass: btoa(stored + ':') }
    }
    // missing / invalid → leave blank
    return { ...u, pass: stored || '' }
  })
  if (changed) saveUsers(out)
  return out
}

function getUsers(){ return normalizeUsers(parseUsers()) }
function setUsers(users){ saveUsers(users) }

export function getCurrentUser(){
  const id = localStorage.getItem(CUR)
  if (!id) return null
  const users = getUsers()
  return users.find(u => u.id === id) || null
}

export function listUsers(){ return getUsers() }

export function adminSetPassword({ userId, newPassword }){
  const users = getUsers()
  const idx = users.findIndex(u => u.id === userId)
  if (idx < 0) throw new Error('User nicht gefunden')
  const salt = makeSalt()
  const { b64 } = computeHashes(newPassword, salt)
  users[idx] = { ...users[idx], pass: b64 }
  setUsers(users)
  return users[idx]
}

export function deleteUser(userId){
  const users = getUsers().filter(u => u.id !== userId)
  setUsers(users)
  const cur = localStorage.getItem(CUR)
  if (cur === userId) localStorage.removeItem(CUR)
}

export async function registerUser({ email, password, displayName }){
  email = String(email || '').trim().toLowerCase()
  const users = getUsers()
  if (users.some(u => u.email === email)) throw new Error('E-Mail bereits registriert.')
  const salt = makeSalt()
  const { b64 } = computeHashes(password, salt)
  const u = { id: crypto.randomUUID?.() || Math.random().toString(36).slice(2), email, displayName: displayName || '', pass: b64 }
  users.push(u); setUsers(users); localStorage.setItem(CUR, u.id)
  return u
}

export async function loginUser({ email, password }){
  email = String(email || '').trim().toLowerCase()
  const users = getUsers()
  const u = users.find(x => x.email === email)
  if (!u) throw new Error('Unbekannte E-Mail.')
  const storedRaw = typeof u.pass === 'string' ? u.pass : ''

  // Try to decode to get salt; if fails, handle gracefully
  let salt = ''
  let normalizedB64 = ''
  try {
    const dec = atob(storedRaw)
    const [hex, s=''] = String(dec).split(':')
    salt = s
    normalizedB64 = btoa(hex + ':' + s)
  } catch {
    // maybe legacy "hex:salt"
    if (typeof storedRaw === 'string' && storedRaw.indexOf(':') !== -1){
      const [hex, s=''] = storedRaw.split(':')
      salt = s
      normalizedB64 = btoa(hex + ':' + s)
    } else if (storedRaw) {
      // maybe only "hex"
      salt = ''
      normalizedB64 = btoa(storedRaw + ':')
    } else {
      throw new Error('Kein Passwort hinterlegt – bitte registrieren oder über Admin zurücksetzen.')
    }
  }

  const { hex, pair, b64 } = computeHashes(password, salt)
  const ok = (storedRaw === b64) || (storedRaw === pair) || (storedRaw === hex) || (storedRaw === normalizedB64)
  if (!ok) throw new Error('Falsches Passwort.')

  // migrate to b64
  if (storedRaw !== b64){
    const all = users.map(x => x.id === u.id ? { ...x, pass: b64 } : x)
    setUsers(all)
  }
  localStorage.setItem(CUR, u.id)
  return u
}

export function logoutUser(){ localStorage.removeItem(CUR) }
