import React from 'react'
import { motion } from 'framer-motion'
const spring = { type: 'spring', stiffness: 300, damping: 30, mass: 0.8 }
export default function Steps({ current }){
  const list = ['Daten','Zahlung','Bestätigen']
  return (
    <div className="grid grid-cols-3 gap-2 text-xs">
      {list.map((label,i)=>{
        const n = i+1
        const active = n <= current
        return (
          <motion.div key={label} layout className={`relative rounded-full px-3 py-1 text-center border ${active ? 'border-cyan-500 text-cyan-600 dark:text-cyan-300' : 'border-zinc-300 dark:border-zinc-700 text-zinc-500'}`} transition={spring}>
            {n}. {label}
            {active && <motion.span layoutId="steps-underline" className="absolute left-2 right-2 -bottom-[2px] h-[2px] bg-cyan-500/70" />}
          </motion.div>
        )
      })}
    </div>
  )
}
