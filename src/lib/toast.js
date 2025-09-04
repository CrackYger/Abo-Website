export function toast(text, type='info', ttl=2600){
  const id = Date.now() + Math.random()
  window.dispatchEvent(new CustomEvent('app_toast', { detail: { id, text, type, ttl } }))
  return id
}
