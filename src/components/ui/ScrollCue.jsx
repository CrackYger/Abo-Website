import React from 'react'
import { motion } from 'framer-motion'

export default function ScrollCue({ to = '#preise' }){
  return (
    <button onClick={()=>{
      const el = document.querySelector(to); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }} className="group mx-auto mt-10 flex flex-col items-center gap-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
      <span className="text-xs">weiter</span>
      <motion.div initial={{ y: 0 }} animate={{ y: [0, 6, 0] }} transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        className="h-6 w-6 rounded-full border border-zinc-300 dark:border-zinc-700 grid place-items-center">
        ↓
      </motion.div>
    </button>
  )
}
