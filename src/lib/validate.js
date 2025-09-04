export const isNonEmpty = (s='') => !!String(s).trim()
export const isEmail = (s='') => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(s).trim())
export const isStrongishPass = (s='') => String(s).length >= 6
