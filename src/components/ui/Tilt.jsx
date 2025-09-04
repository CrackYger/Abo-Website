import React, { useRef } from 'react'
import { motion, useMotionValue, useTransform } from 'framer-motion'

export default function Tilt({ children, max=8, className='' }){
  const ref = useRef(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rx = useTransform(y, [ -0.5, 0.5 ], [ max, -max ])
  const ry = useTransform(x, [ -0.5, 0.5 ], [ -max, max ])

  function onMove(e){
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    x.set(px); y.set(py)
  }
  function onLeave(){ x.set(0); y.set(0) }

  return (
    <motion.div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave}
      style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }}
      className={className}>
      {children}
    </motion.div>
  )
}
