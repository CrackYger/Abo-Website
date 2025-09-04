import React from 'react'
import { motion } from 'framer-motion'
import { spring } from '../../lib/motion.js'

export default function AnimatedButton({ children, className='', ...props }){
  return (
    <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}
      transition={spring}
      className={'btn-shimmer rounded-xl px-4 py-2 text-sm font-semibold shadow ' + className}
      {...props}>
      <span className="relative z-[1]">{children}</span>
    </motion.button>
  )
}
