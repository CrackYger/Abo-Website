export const ease = [0.16, 1, 0.3, 1]
export const spring = { type: 'spring', stiffness: 280, damping: 26, mass: 0.9 }
export const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: (i=0) => ({ opacity: 1, y: 0, transition: { delay: i*0.06, duration: 0.45, ease } })
}
export const pop = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.4, ease } },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.2, ease } }
}
export const hoverLift = {
  hover: { y: -4, scale: 1.01, transition: { type: 'spring', stiffness: 320, damping: 22 } },
  tap: { scale: 0.985 }
}
