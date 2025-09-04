import React, { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export default function ToastHost(){
  const [list, setList] = useState([])

  useEffect(()=>{
    function onToast(e){
      const item = e.detail
      setList(prev => [...prev, item])
      setTimeout(()=>{ setList(prev => prev.filter(x => x.id !== item.id)) }, item.ttl || 2600)
    }
    window.addEventListener('app_toast', onToast)
    return () => window.removeEventListener('app_toast', onToast)
  }, [])

  const colors = {
    info: 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900',
    success: 'bg-emerald-600 text-white',
    warn: 'bg-amber-600 text-white',
    error: 'bg-red-600 text-white',
  }

  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[60] -translate-x-1/2">
      <div className="flex flex-col gap-2 items-center">
        <AnimatePresence>
          {list.map((t) => (
            <motion.div key={t.id} initial={{ y: 20, opacity: 0, scale: .98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: -10, opacity: 0, scale: .98 }} transition={{ type: 'spring', stiffness: 340, damping: 24 }}
              className={`pointer-events-auto rounded-xl px-4 py-2 text-sm shadow-lg ${colors[t.type] || colors.info}`}>
              {t.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
